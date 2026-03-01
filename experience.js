// Mibera Experience — App Logic
// Sprint 1: Data + Lookup + Drug Picker + Dose Selector
// Sprint 2: Effects Engine + Narrative
// Sprint 3: Full Effect Library + Mobile + Polish + Deep Link
// Zero dependencies. Vanilla JS. Lazy-loads JSON data.

(function () {
  "use strict";

  // === State ===
  var miberaData  = null;
  var drugData    = null;
  var ruleData    = null;
  var isLoading   = false;

  var selectedMibera  = null;
  var selectedDrug    = null;
  var selectedDose    = null;
  var activeCategory  = "all";
  var currentEngine   = null;

  // Trait keys to highlight (amber)
  var KEY_TRAITS = ["archetype", "element", "ancestor"];

  // Traits to display in the mibera card
  var MIBERA_DISPLAY_TRAITS = [
    ["ancestor",       "Ancestor"],
    ["archetype",      "Archetype"],
    ["element",        "Element"],
    ["sun_sign",       "Sun Sign"],
    ["moon_sign",      "Moon Sign"],
    ["ascending_sign", "Rising"],
    ["swag_rank",      "Swag Rank"],
  ];

  // === DOM refs ===
  var stepLookup   = document.getElementById("step-lookup");
  var stepTraits   = document.getElementById("step-traits");
  var stepDrug     = document.getElementById("step-drug");
  var stepDose     = document.getElementById("step-dose");
  var stepExp      = document.getElementById("step-experience");

  var lookupForm   = document.getElementById("lookup-form");
  var tokenInput   = document.getElementById("token-input");
  var lookupBtn    = document.getElementById("lookup-btn");
  var lookupLoading= document.getElementById("lookup-loading");
  var lookupError  = document.getElementById("lookup-error");
  var lookupErrorMsg = document.getElementById("lookup-error-msg");

  var miberaImg    = document.getElementById("mibera-img");
  var miberaImgFB  = document.getElementById("mibera-img-fallback");
  var miberaName   = document.getElementById("mibera-name");
  var miberaNumber = document.getElementById("mibera-number");
  var miberaTraits = document.getElementById("mibera-traits");
  var loreDrugCard = document.getElementById("lore-drug-card");
  var loreDrugName = document.getElementById("lore-drug-name");
  var loreDrugTarot= document.getElementById("lore-drug-tarot");
  var continueBtn  = document.getElementById("continue-to-drug");

  var drugSearch   = document.getElementById("drug-search");
  var drugList     = document.getElementById("drug-list");
  var drugDetail   = document.getElementById("drug-detail");
  var drugDetailName    = document.getElementById("drug-detail-name");
  var drugDetailCat     = document.getElementById("drug-detail-cat");
  var drugDetailSummary = document.getElementById("drug-detail-summary");
  var drugDetailFill    = document.getElementById("drug-detail-intensity-fill");
  var drugDetailNum     = document.getElementById("drug-detail-intensity-num");
  var drugDetailTarot   = document.getElementById("drug-detail-tarot");

  var doseBtns     = document.querySelectorAll(".dose-btn");
  var beginBtn     = document.getElementById("begin-btn");
  var restartBtn   = document.getElementById("restart-btn");
  var copyLinkBtn  = document.getElementById("copy-link-btn");

  // Category filter buttons
  var catFilters   = document.querySelectorAll(".cat-filter");

  // === Event Listeners ===
  lookupForm.addEventListener("submit", handleLookup);
  continueBtn.addEventListener("click", showDrugPicker);
  drugSearch.addEventListener("input", filterDrugList);
  beginBtn.addEventListener("click", beginExperience);
  restartBtn.addEventListener("click", restart);

  catFilters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeCategory = btn.dataset.cat;
      catFilters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      filterDrugList();
    });
  });

  doseBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      doseBtns.forEach(function (b) {
        b.classList.remove("selected");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-pressed", "true");
      selectedDose = btn.dataset.dose;
      showBeginButton();
    });
  });

  // === Copy link handler (TASK-3.6) ===
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", function () {
      if (!selectedMibera || !selectedDrug || !selectedDose) return;
      var url = new URL(window.location.href);
      url.searchParams.set("t", selectedMibera.token_id);
      url.searchParams.set("d", selectedDrug.slug);
      url.searchParams.set("dose", selectedDose);
      navigator.clipboard.writeText(url.toString()).then(function () {
        var original = copyLinkBtn.textContent;
        copyLinkBtn.textContent = "Copied!";
        setTimeout(function () { copyLinkBtn.textContent = original; }, 2000);
      }).catch(function () {
        // Fallback: select a temp input
        var tmp = document.createElement("input");
        tmp.value = url.toString();
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
        copyLinkBtn.textContent = "Copied!";
        setTimeout(function () { copyLinkBtn.textContent = "Copy Link"; }, 2000);
      });
    });
  }

  // === Background canvas (re-use gothic backdrop) ===
  initBackground();

  // =========================================================
  // STEP 1 — TOKEN LOOKUP
  // =========================================================

  async function handleLookup(e) {
    e.preventDefault();
    if (isLoading) return;

    var raw = tokenInput.value.trim();
    var num = parseInt(raw, 10);
    if (!raw || isNaN(num) || num < 1 || num > 10000) {
      showLookupError("Enter a number between 1 and 10,000.");
      return;
    }

    hideLookupError();
    setLookupLoading(true);

    try {
      await ensureMiberaDataLoaded();
    } catch (err) {
      showLookupError("Failed to load Mibera data. Try refreshing the page.");
      setLookupLoading(false);
      return;
    }

    var tokenId = String(num);
    var mibera = miberaData[tokenId];
    if (!mibera) {
      showLookupError("Mibera #" + tokenId + " not found.");
      setLookupLoading(false);
      return;
    }

    selectedMibera = mibera;
    selectedMibera.token_id = tokenId;

    // Pre-load image before showing traits
    preloadImage(mibera.image, function (ok) {
      setLookupLoading(false);
      renderMiberaCard(mibera, ok);
      showStep(stepTraits);
    });
  }

  function preloadImage(src, callback) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = function () { callback(true); };
    img.onerror = function () { callback(false); };
    img.src = src;
  }

  // =========================================================
  // STEP 2 — MIBERA CARD
  // =========================================================

  function renderMiberaCard(mibera, imageLoaded) {
    // Image
    if (imageLoaded) {
      miberaImg.src = mibera.image;
      miberaImg.alt = mibera.name || "Mibera #" + mibera.token_id;
      miberaImg.hidden = false;
      miberaImgFB.hidden = true;
    } else {
      miberaImg.hidden = true;
      miberaImgFB.hidden = false;
    }

    miberaImg.onerror = function () {
      miberaImg.hidden = true;
      miberaImgFB.hidden = false;
    };

    // Name + number
    miberaName.textContent = mibera.name || ("Mibera #" + mibera.token_id);
    miberaNumber.textContent = "Token #" + mibera.token_id;

    // Traits
    var html = "";
    for (var i = 0; i < MIBERA_DISPLAY_TRAITS.length; i++) {
      var key   = MIBERA_DISPLAY_TRAITS[i][0];
      var label = MIBERA_DISPLAY_TRAITS[i][1];
      var val   = mibera[key];
      if (!val || val === "none" || val === "") continue;

      // Skip drug from traits (shown in lore card below)
      if (key === "drug") continue;

      var isKey = KEY_TRAITS.indexOf(key) !== -1;
      html += '<div class="trait-row">' +
        '<span class="trait-label">' + escapeHTML(label) + "</span>" +
        '<span class="trait-value' + (isKey ? " trait-value--key" : "") + '">' +
          escapeHTML(capitalize(val)) +
        "</span>" +
        "</div>";
    }
    miberaTraits.innerHTML = html;

    // Lore drug card
    var drug = mibera.drug;
    if (drug) {
      loreDrugName.textContent = capitalize(drug);
      // Try to get tarot from loaded drug data; show placeholder if not loaded yet
      loreDrugTarot.textContent = "Loading tarot…";
      loreDrugCard.hidden = false;

      // Update tarot once drugs are loaded
      ensureDrugDataLoaded().then(function () {
        var drugEntry = drugData && drugData[drug];
        if (drugEntry) {
          loreDrugTarot.textContent =
            drugEntry.connections.tarot + " · " + drugEntry.connections.suit;
        } else {
          loreDrugTarot.textContent = "Unknown card";
        }
      }).catch(function () {
        loreDrugTarot.textContent = "";
      });
    } else {
      loreDrugCard.hidden = true;
    }
  }

  // =========================================================
  // STEP 3 — DRUG PICKER
  // =========================================================

  async function showDrugPicker() {
    showStep(stepDrug);

    if (!drugData) {
      try {
        await ensureDrugDataLoaded();
      } catch (err) {
        drugList.innerHTML =
          '<p class="drug-empty">Failed to load substance data. Refresh and try again.</p>';
        return;
      }
    }

    renderDrugList(getAllDrugs());
  }

  function getAllDrugs() {
    if (!drugData) return [];
    return Object.keys(drugData).map(function (slug) {
      return drugData[slug];
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  function filterDrugList() {
    var query = drugSearch.value.trim().toLowerCase();
    var all = getAllDrugs();

    var filtered = all.filter(function (drug) {
      var matchCat = activeCategory === "all" || drug.category === activeCategory;
      var matchSearch = !query ||
        drug.name.toLowerCase().indexOf(query) !== -1 ||
        drug.slug.indexOf(query) !== -1 ||
        drug.category.indexOf(query) !== -1;
      return matchCat && matchSearch;
    });

    renderDrugList(filtered);
  }

  function renderDrugList(drugs) {
    if (drugs.length === 0) {
      drugList.innerHTML = '<p class="drug-empty">No substances found.</p>';
      return;
    }

    var loreDrug = selectedMibera ? selectedMibera.drug : null;
    var html = "";

    for (var i = 0; i < drugs.length; i++) {
      var d = drugs[i];
      var isLore = loreDrug && d.slug === loreDrug;
      var isSelected = selectedDrug && d.slug === selectedDrug.slug;

      html += '<div class="drug-item' + (isSelected ? " selected" : "") + '" ' +
        'role="option" ' +
        'aria-selected="' + isSelected + '" ' +
        'data-slug="' + escapeAttr(d.slug) + '">' +
        '<span class="drug-item-name">' + escapeHTML(d.name) + "</span>" +
        '<span class="cat-badge cat-badge--' + escapeAttr(d.category) + '">' +
          escapeHTML(d.category) +
        "</span>" +
        (isLore ? '<span class="drug-item-lore">✦ LORE</span>' : "") +
        "</div>";
    }

    drugList.innerHTML = html;

    // Bind click events
    var items = drugList.querySelectorAll(".drug-item");
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var slug = item.dataset.slug;
        selectDrug(slug);
      });
    });
  }

  function selectDrug(slug) {
    if (!drugData || !drugData[slug]) return;

    selectedDrug = drugData[slug];

    // Update selected state in list
    var items = drugList.querySelectorAll(".drug-item");
    items.forEach(function (item) {
      var isThis = item.dataset.slug === slug;
      item.classList.toggle("selected", isThis);
      item.setAttribute("aria-selected", isThis ? "true" : "false");
    });

    // Show detail
    drugDetailName.textContent = selectedDrug.name;
    drugDetailCat.textContent = capitalize(selectedDrug.category);
    drugDetailSummary.textContent = selectedDrug.effects_summary;
    var pct = (selectedDrug.intensity / 10) * 100;
    drugDetailFill.style.width = pct + "%";
    drugDetailNum.textContent = selectedDrug.intensity + "/10";
    drugDetailTarot.textContent =
      selectedDrug.connections.tarot + " · " + selectedDrug.connections.suit;
    drugDetail.hidden = false;

    // Reveal dose step
    showStep(stepDose);
    selectedDose = null;
    doseBtns.forEach(function (b) {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });
    beginBtn.classList.remove("visible");
    beginBtn.disabled = true;
  }

  // =========================================================
  // STEP 4 — DOSE SELECTOR
  // =========================================================

  function showBeginButton() {
    if (selectedDrug && selectedDose) {
      beginBtn.classList.add("visible");
      beginBtn.disabled = false;
    }
  }

  // =========================================================
  // STEP 5 — EXPERIENCE (Sprint 2 placeholder)
  // =========================================================

  function beginExperience() {
    if (!selectedMibera || !selectedDrug || !selectedDose) return;
    showStep(stepExp);

    // Stop any previously running engine
    if (currentEngine) {
      currentEngine.stop();
      currentEngine = null;
    }

    var canvas = document.getElementById("trip-canvas");

    ensureRuleDataLoaded().then(function () {
      var engine = new EffectsEngine(
        canvas, selectedMibera, selectedDrug, selectedDose, ruleData
      );
      currentEngine = engine;

      // Load image with CORS flag for canvas drawImage (TASK-2.5)
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = function () { engine.start(img); };
      img.onerror = function () { engine.start(null); };  // CORS blocked or image missing — effects run on dark bg
      img.src = selectedMibera.image;

      // Narrative text appears after 2 seconds — let effects establish (TASK-2.4)
      setTimeout(showNarrative, 2000);
    }).catch(function () {
      // Rule data unavailable — minimal canvas fallback
      var maxW = Math.min(window.innerWidth * 0.9, 600);
      canvas.width  = maxW;
      canvas.height = maxW;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, maxW, maxW);
      ctx.font = "bold 16px 'Cinzel', serif";
      ctx.fillStyle = "rgba(196,154,26,0.7)";
      ctx.textAlign = "center";
      ctx.fillText(selectedDrug.name, maxW / 2, maxW / 2);
      showNarrative();
    });
  }

  function showNarrative() {
    if (!selectedDrug || !selectedDose) return;

    // Guard against missing dose_modifiers (MEDIUM-001 fix)
    var dm = ruleData && ruleData.dose_modifiers;
    var doseInfo = dm ? dm[selectedDose] : null;
    var prefix = doseInfo && doseInfo.narrative_prefix ? doseInfo.narrative_prefix + " " : "";

    var general = (selectedDrug.narrative_template && selectedDrug.narrative_template.general)
      ? selectedDrug.narrative_template.general
      : "";
    document.getElementById("narrative-general-text").textContent = (prefix + general).trim();

    var personal = buildPersonalNarrative();
    document.getElementById("narrative-personal-text").textContent = personal;
  }

  function buildPersonalNarrative() {
    if (!selectedMibera || !selectedDrug || !ruleData) {
      return "Your Mibera's unique constellation shapes this experience beyond what words carry.";
    }

    var parts = [];
    var m = selectedMibera;

    // Archetype flavour
    var archSlug = m.archetype ? m.archetype.toLowerCase() : "";
    var archEntry = ruleData.archetypes && ruleData.archetypes[archSlug];
    if (archEntry) {
      parts.push(archetypeNarrative(archSlug, selectedDrug.category));
    }

    // Ancestor flavour — use lore string if available
    var ancSlug = m.ancestor ? m.ancestor.toLowerCase() : "";
    var ancEntry = ruleData.ancestors && ruleData.ancestors[ancSlug];
    if (ancEntry) {
      parts.push(ancEntry.lore
        ? capitalize(m.ancestor) + ": " + ancEntry.lore + "."
        : "The " + capitalize(m.ancestor) + " lineage opens something specific here.");
    }

    // Element flavour
    var elem = m.element ? m.element.toLowerCase() : "";
    var elemNarr = {
      earth: "Your Earth nature grounds the experience — sensation before thought.",
      water: "Your Water nature carries it deeper — emotion first, then understanding.",
      air:   "Your Air nature sharpens the edges — the mind cannot stop narrating.",
      fire:  "Your Fire nature amplifies everything — intensity is the only setting."
    };
    if (elemNarr[elem]) parts.push(elemNarr[elem]);

    // Item flavour (textContent assignment — no HTML escaping needed)
    if (m.item && m.item !== "none" && m.item !== "") {
      parts.push("The " + capitalize(m.item) + " seems\u2026 aware.");
    }

    if (parts.length === 0) {
      return "The substances and the soul meet without ceremony. Whatever happens, happens completely.";
    }

    return parts.join(" ");
  }

  function archetypeNarrative(archSlug, category) {
    var map = {
      "freetekno":     "The free party pulses under your feet. This is a field in England, 3am, and nothing is illegal tonight.",
      "milady":        "You observe yourself experiencing this. The distance is the experience.",
      "chicago/detroit": "The beat is underneath everything. Black queer joy encoded in four-four time.",
      "acidhouse":     "The smiley face knows. The warehouse remembers. You are exactly who this music was made for."
    };
    return map[archSlug] || "";
  }

  // =========================================================
  // DATA LOADING
  // =========================================================

  async function ensureMiberaDataLoaded() {
    if (miberaData) return;

    var resp = await fetch("data/miberas.json");
    if (!resp.ok) throw new Error("Failed to fetch miberas.json: " + resp.status);
    miberaData = await resp.json();
  }

  async function ensureDrugDataLoaded() {
    if (drugData) return;

    var resp = await fetch("data/codex-drugs.json");
    if (!resp.ok) throw new Error("Failed to fetch codex-drugs.json: " + resp.status);
    var json = await resp.json();
    drugData = json.drugs;
  }

  async function ensureRuleDataLoaded() {
    if (ruleData) return;

    var resp = await fetch("data/effect-rules.json");
    if (!resp.ok) throw new Error("Failed to fetch effect-rules.json: " + resp.status);
    ruleData = await resp.json();
  }

  function getRuleData() {
    return ruleData || {};
  }

  // =========================================================
  // STEP NAVIGATION
  // =========================================================

  function showStep(step) {
    // Steps revealed progressively — never hide already-visible ones,
    // just reveal the target step.
    step.hidden = false;
    // Smooth scroll to the newly revealed step
    setTimeout(function () {
      step.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function restart() {
    if (currentEngine) {
      currentEngine.stop();
      currentEngine = null;
    }

    selectedMibera = null;
    selectedDrug   = null;
    selectedDose   = null;

    tokenInput.value = "";
    drugSearch.value = "";
    activeCategory   = "all";
    catFilters.forEach(function (b) { b.classList.remove("active"); });
    catFilters[0].classList.add("active");

    doseBtns.forEach(function (b) {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });

    beginBtn.classList.remove("visible");
    beginBtn.disabled = true;

    drugDetail.hidden = true;
    drugList.innerHTML = "";

    stepTraits.hidden  = true;
    stepDrug.hidden    = true;
    stepDose.hidden    = true;
    stepExp.hidden     = true;

    hideLookupError();

    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(function () { tokenInput.focus(); }, 400);
  }

  // =========================================================
  // LOADING + ERROR HELPERS
  // =========================================================

  function setLookupLoading(on) {
    isLoading = on;
    lookupLoading.hidden = !on;
    lookupBtn.disabled = on;
  }

  function showLookupError(msg) {
    lookupErrorMsg.textContent = msg;
    lookupError.hidden = false;
  }

  function hideLookupError() {
    lookupError.hidden = true;
  }

  // =========================================================
  // UTILITIES
  // =========================================================

  function escapeHTML(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeText(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // =========================================================
  // BACKGROUND CANVAS — Gothic atmosphere
  // Simplified version of the Valentine Match background.
  // =========================================================

  function initBackground() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    function draw() {
      var W = canvas.width  = window.innerWidth;
      var H = canvas.height = window.innerHeight;

      // Deep near-black sky
      var sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#05020a");
      sky.addColorStop(0.5, "#080310");
      sky.addColorStop(1, "#060208");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Subtle horizon glow
      var glow = ctx.createRadialGradient(W * 0.5, H * 0.8, 0, W * 0.5, H * 0.8, W * 0.5);
      glow.addColorStop(0, "rgba(90, 10, 28, 0.08)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Scattered dim stars
      var rng = (function (s) {
        return function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
      }(7331));

      ctx.fillStyle = "rgba(200, 180, 220, 0.5)";
      for (var s = 0; s < 80; s++) {
        var sx = rng() * W;
        var sy = rng() * H * 0.65;
        var sr = 0.4 + rng() * 0.8;
        var sa = 0.1 + rng() * 0.35;
        ctx.globalAlpha = sa;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Faint floating triangles (cultist symbols)
      var tri = (function (s2) {
        return function () { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
      }(6661));
      for (var t = 0; t < 8; t++) {
        var tx = tri() * W;
        var ty = tri() * H * 0.6;
        var ts = 12 + tri() * 28;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate((tri() - 0.5) * 0.3);
        ctx.globalAlpha = 0.03 + tri() * 0.05;
        ctx.beginPath();
        ctx.moveTo(0, -ts * 1.3);
        ctx.lineTo(-ts * 0.55, ts * 0.5);
        ctx.lineTo( ts * 0.55, ts * 0.5);
        ctx.closePath();
        ctx.strokeStyle = "rgba(139, 26, 58, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    draw();
    window.addEventListener("resize", draw);
  }

  // === Initialise: pre-load rule data in background ===
  ensureRuleDataLoaded().catch(function () {
    // Non-fatal — will retry if needed
  });

  // === Deep link / share URL auto-trigger (TASK-3.6) ===
  // ?t=1234&d=mdma&dose=experienced — pre-fills and auto-triggers experience
  (function initDeepLink() {
    var params = new URLSearchParams(window.location.search);
    var t     = params.get("t");
    var d     = params.get("d");
    var dose  = params.get("dose");
    if (!t) return;

    var num = parseInt(t, 10);
    if (!num || num < 1 || num > 10000) return;

    tokenInput.value = String(num);

    // Load data, then apply deep link state
    Promise.all([ensureMiberaDataLoaded(), ensureDrugDataLoaded(), ensureRuleDataLoaded()])
      .then(function () {
        var mibera = miberaData && miberaData[String(num)];
        if (!mibera) return;

        selectedMibera = mibera;
        selectedMibera.token_id = String(num);

        // LOW-011: pre-load image before rendering card, consistent with handleLookup
        preloadImage(mibera.image, function (ok) {
          renderMiberaCard(mibera, ok);
          showStep(stepTraits);

          if (!d || !drugData || !drugData[d]) {
            // Token only — stop after traits
            return;
          }

          selectedDrug = drugData[d];
          showStep(stepDrug);
          renderDrugList(getAllDrugs());
          // Reflect selection in list after render
          setTimeout(function () { selectDrug(d); }, 50);

          var validDoses = ["first_time", "experienced", "fuck_me_up"];
          if (dose && validDoses.indexOf(dose) !== -1) {
            selectedDose = dose;
            doseBtns.forEach(function (b) {
              var match = b.dataset.dose === dose;
              b.classList.toggle("selected", match);
              b.setAttribute("aria-pressed", match ? "true" : "false");
            });
            showBeginButton();

            // Auto-trigger experience on next tick to let DOM settle
            setTimeout(beginExperience, 200);
          }
        });
      })
      .catch(function () {
        // Deep link failed — silently degrade to clean state
      });
  }());

  // =========================================================
  // SPRINT 2 — EFFECTS ENGINE + COMPOSITOR + NARRATIVE
  // =========================================================

  // ---- Known implemented effects (Sprint 2: 8, Sprint 3: +8 = 16 total) ----
  var KNOWN_EFFECTS = [
    // Sprint 2
    "colorShift", "breathingWarp", "gravitySag", "amberVignette",
    "thoughtBubbles", "chromaticAberration", "auraBreathing", "rippleWaves",
    // Sprint 3 (TASK-3.1)
    "thoughtSpiral", "shadowFigures", "pixelWarp", "mandala",
    "tunnelVortex", "eyeDilation", "glitchBars", "chillFume"
  ];

  // ---- Effect compositor (TASK-2.3) ----

  function selectEffects(mibera, drug, dose, ruleData, deviceTier) {
    var effects = [];

    // 1. Drug base effects
    if (drug.visual_profile && drug.visual_profile.base_effects) {
      effects = drug.visual_profile.base_effects.slice();
    }

    // 2. Ancestor modifier
    var ancestor = mibera.ancestor ? mibera.ancestor.toLowerCase() : "";
    var ancRule = ruleData.ancestors && ruleData.ancestors[ancestor];
    if (ancRule && ancRule.add_effects) {
      effects = effects.concat(ancRule.add_effects);
    }

    // 3. Archetype modifier
    var archetype = mibera.archetype ? mibera.archetype.toLowerCase() : "";
    var archRule = ruleData.archetypes && ruleData.archetypes[archetype];
    if (archRule && archRule.add_effects) {
      effects = effects.concat(archRule.add_effects);
    }

    // 4. Element modifier
    var element = mibera.element ? mibera.element.toLowerCase() : "";
    var elemRule = ruleData.elements && ruleData.elements[element];
    if (elemRule && elemRule.add_effects) {
      effects = effects.concat(elemRule.add_effects);
    }

    // 5. Tarot suit modifier (derived from drug connections)
    var suit = drug.connections && drug.connections.suit ? drug.connections.suit : "";
    var suitRule = ruleData.tarot_suits && ruleData.tarot_suits[suit];
    if (suitRule && suitRule.add_effects) {
      effects = effects.concat(suitRule.add_effects);
    }

    // 6. Dose extra effects
    var doseMod = ruleData.dose_modifiers && ruleData.dose_modifiers[dose];
    if (doseMod && doseMod.extra_effects) {
      effects = effects.concat(doseMod.extra_effects);
    }

    // 7. Filter to implemented effects + deduplicate
    var seen = {};
    var filtered = [];
    for (var i = 0; i < effects.length; i++) {
      var eff = effects[i];
      if (KNOWN_EFFECTS.indexOf(eff) !== -1 && !seen[eff]) {
        seen[eff] = true;
        filtered.push(eff);
      }
    }

    // Fallback: ensure at least one visible effect — use palette-appropriate effects (CA-2 fix)
    if (filtered.length === 0) {
      var cat = drug.category || "other";
      if (cat === "dissociative" || cat === "depressant") {
        filtered.push("tunnelVortex", "breathingWarp");
      } else if (cat === "stimulant") {
        filtered.push("colorShift", "rippleWaves");
      } else {
        filtered.push("amberVignette", "breathingWarp");
      }
    }

    // 8. Cap: device tier + dose max
    var maxEffects = doseMod ? doseMod.max_effects : 5;
    if (deviceTier === "low") maxEffects = Math.min(maxEffects, 4);

    return filtered.slice(0, maxEffects);
  }

  // ---- Palette selector ----

  function selectPalette(drug, mibera, ruleData) {
    var catPalettes = {
      psychedelic:  { hex: "#5c2175", css: "hue-rotate(200deg) saturate(1.5)" },
      empathogen:   { hex: "#c49a1a", css: "hue-rotate(320deg) saturate(1.3)" },
      stimulant:    { hex: "#c4611a", css: "hue-rotate(30deg) saturate(1.4)" },
      dissociative: { hex: "#1a4a8b", css: "hue-rotate(180deg) saturate(0.8)" },
      depressant:   { hex: "#2a3a6a", css: "hue-rotate(220deg) saturate(0.7)" },
      entheogen:    { hex: "#1a6b3a", css: "hue-rotate(140deg) saturate(1.6)" },
      cannabinoid:  { hex: "#2d6b1a", css: "hue-rotate(100deg) saturate(1.2)" },
      adaptogen:    { hex: "#8b7a1a", css: "hue-rotate(60deg) saturate(1.0)" },
      deliriant:    { hex: "#8b1a1a", css: "hue-rotate(0deg) saturate(0.6)" },
      other:        { hex: "#3a1a6b", css: "hue-rotate(270deg) saturate(1.1)" }
    };
    var palette = catPalettes[drug.category] || catPalettes.other;

    // Override with ancestor palette_tint if available
    var ancestor = mibera.ancestor ? mibera.ancestor.toLowerCase() : "";
    var ancRule = ruleData.ancestors && ruleData.ancestors[ancestor];
    if (ancRule && ancRule.palette_tint && ruleData.palette_tints) {
      var tint = ruleData.palette_tints[ancRule.palette_tint];
      if (tint) palette = { hex: tint.hex, css: tint.css };
    }

    return palette;
  }

  // ---- Hex → rgba helper ----

  function hexAlpha(hex, alpha) {
    if (!hex || hex.length < 7) return "rgba(0,0,0," + alpha + ")";
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha.toFixed(2) + ")";
  }

  // ---- Effect draw functions (TASK-2.2) ----
  // Signature: (ctx, t, intensity, palette, W, H [, params])

  var EFFECTS = {

    // 1. amberVignette — radial amber glow at canvas edge
    amberVignette: function (ctx, t, intensity, palette, W, H) {
      var gradient = ctx.createRadialGradient(W / 2, H / 2, W * 0.18, W / 2, H / 2, W * 0.72);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      var alpha = (0.15 + 0.1 * Math.abs(Math.sin(t * 0.5))) * intensity;
      gradient.addColorStop(1, "rgba(196, 154, 26, " + alpha.toFixed(2) + ")");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    },

    // 2. rippleWaves — concentric rings from canvas center
    rippleWaves: function (ctx, t, intensity, palette, W, H) {
      var cx = W / 2;
      var cy = H / 2;
      var maxR = Math.min(W, H) * 0.47;
      var hex = palette.hex || "#5c2175";
      for (var i = 0; i < 3; i++) {
        var phase = ((t * 1.2) + i * 1.1) % 3.3;
        var r = (phase / 3.3) * maxR;
        var alpha = (1 - phase / 3.3) * 0.35 * intensity;
        if (alpha < 0.01) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha(hex, alpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },

    // 3. thoughtBubbles — floating paranoid text near Mibera head
    thoughtBubbles: function (ctx, t, intensity, palette, W, H, params) {
      var bubbles = params && params.bubbles ? params.bubbles : [];
      ctx.textAlign = "center";
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        var alpha = 0.3 + 0.5 * Math.abs(Math.sin((t - b.phase) / b.speed));
        alpha = Math.min(alpha, 0.85) * intensity;
        if (alpha < 0.04) continue;
        var fs = Math.round(11 + 2 * intensity);
        ctx.font = "italic " + fs + "px 'Crimson Text', serif";
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(220, 210, 230, 1)";
        ctx.fillText(b.text, b.x * W, b.y * H);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "start";
    },

    // ---- TASK-3.1: Sprint 3 Effects ----

    // 4. thoughtSpiral — text rotating in a slow orbit (dissociative / high-dose)
    thoughtSpiral: function (ctx, t, intensity, palette, W, H, params) {
      var words = params && params.bubbles && params.bubbles.length
        ? params.bubbles.map(function (b) { return b.text; })
        : ["dissolving", "looping", "who am i", "the spiral"];
      var cx = W / 2;
      var cy = H / 2;
      var r  = Math.min(W, H) * 0.34;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (var i = 0; i < words.length; i++) {
        var angle = (t * 0.18 * intensity) + (i / words.length) * Math.PI * 2;
        var x = cx + Math.cos(angle) * r;
        var y = cy + Math.sin(angle) * r * 0.6;
        var alpha = (0.25 + 0.4 * Math.abs(Math.sin(t * 0.5 + i))) * intensity;
        ctx.globalAlpha = alpha;
        ctx.font = "italic " + Math.round(10 + 3 * intensity) + "px 'Crimson Text', serif";
        ctx.fillStyle = hexAlpha(palette.hex || "#1a4a8b", 1);
        ctx.fillText(words[i], x, y);
      }
      ctx.globalAlpha = 1;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "start";
      ctx.restore();
    },

    // 5. shadowFigures — dim silhouettes at canvas edges (depressant / opioid)
    shadowFigures: function (ctx, t, intensity, palette, W, H) {
      var count = Math.round(1 + 2 * intensity);
      var rng = (function (s) {
        return function () { s = (s * 16807 + 7) % 2147483647; return s / 2147483647; };
      }(42));
      ctx.save();
      ctx.filter = "blur(4px)";  // LOW-010: set once before loop, not per-iteration
      for (var i = 0; i < count; i++) {
        // Anchor figure to edge zone
        var side = Math.floor(rng() * 4);
        var x = side === 0 ? rng() * W * 0.12
              : side === 1 ? W * 0.88 + rng() * W * 0.12
              : rng() * W;
        var y = side === 2 ? rng() * H * 0.12
              : side === 3 ? H * 0.85 + rng() * H * 0.15
              : rng() * H;
        var h = 30 + rng() * 50;
        var w = h * 0.45;
        var bob = Math.sin(t * (0.3 + rng() * 0.4) + i) * 4 * intensity;
        var alpha = (0.04 + 0.08 * intensity) * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.25 + i)));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#050508";
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y + bob, w * 0.35, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(x, y + bob - h * 0.52, w * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.restore();
    },

    // 6. mandala — procedural sacred geometry overlay (entheogen / earth element)
    mandala: function (ctx, t, intensity, palette, W, H) {
      var cx = W / 2;
      var cy = H / 2;
      var arms = 8;
      var maxR = Math.min(W, H) * 0.42;
      var speed = 0.08 * intensity;
      var hex = palette.hex || "#1a6b3a";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * speed);
      ctx.globalAlpha = 0.12 * intensity;
      ctx.strokeStyle = hex;
      ctx.lineWidth = 1;
      for (var arm = 0; arm < arms; arm++) {
        ctx.save();
        ctx.rotate((arm / arms) * Math.PI * 2);
        for (var ring = 1; ring <= 4; ring++) {
          var r = (ring / 4) * maxR;
          var pts = arms * ring;
          ctx.beginPath();
          for (var p = 0; p <= pts; p++) {
            var angle = (p / pts) * Math.PI * 2;
            var px = Math.cos(angle) * r;
            var py = Math.sin(angle) * r;
            if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    },

    // 7. tunnelVortex — concentric shrinking rings to center (dissociative / ketamine)
    tunnelVortex: function (ctx, t, intensity, palette, W, H) {
      var cx = W / 2;
      var cy = H / 2;
      var maxR = Math.max(W, H) * 0.7;
      var hex = palette.hex || "#1a4a8b";
      var rings = 7;
      for (var i = 0; i < rings; i++) {
        // Phase offset per ring, contracting inward
        var phase = ((t * 0.6 * intensity) + (i / rings)) % 1;
        var r = (1 - phase) * maxR;
        var alpha = phase * 0.45 * intensity;
        if (r < 2 || alpha < 0.01) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha(hex, alpha);
        ctx.lineWidth = 1.2 + phase * 2;
        ctx.stroke();
      }
    },

    // 8. eyeDilation — darkening center with an expanding/contracting pupil (dissociative)
    eyeDilation: function (ctx, t, intensity, palette, W, H) {
      var cx = W / 2;
      var cy = H / 2;
      // Pupil oscillates: slow expand then snap back
      var phase = (t * 0.4 * intensity) % (Math.PI * 2);
      var pupil = Math.min(W, H) * (0.06 + 0.12 * (0.5 + 0.5 * Math.sin(phase)));
      // Dark iris overlay
      var iris = ctx.createRadialGradient(cx, cy, pupil, cx, cy, Math.min(W, H) * 0.32);
      iris.addColorStop(0, "rgba(0,0,0,0)");
      iris.addColorStop(0.6, "rgba(0,0,0,0)");
      iris.addColorStop(1, "rgba(0,0,0," + (0.18 * intensity).toFixed(2) + ")");
      ctx.fillStyle = iris;
      ctx.fillRect(0, 0, W, H);
      // Pupil itself — near-black circle
      var pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, pupil);
      pg.addColorStop(0, "rgba(2,2,4,0.85)");
      pg.addColorStop(1, "rgba(2,2,4,0)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(cx, cy, pupil, 0, Math.PI * 2);
      ctx.fill();
    },

    // 9. chillFume — slow wispy particles (coffee / mild stimulant / adaptogen)
    chillFume: function (ctx, t, intensity, palette, W, H, params) {
      var particles = params && params.fumeParticles ? params.fumeParticles : [];
      var hex = palette.hex || "#8b7a1a";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        // Rise slowly, fade out
        var age = (t - p.born) / p.life;  // 0..1
        if (age > 1) continue;
        var px = p.x * W + Math.sin(t * p.wobble + p.phase) * 12;
        var py = p.y * H - age * p.rise * H;
        var alpha = (1 - age) * 0.18 * intensity;
        var r = p.r * (0.5 + 0.5 * age);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(hex, alpha);
        ctx.fill();
      }
    }

  };

  // ---- Effects Engine class (TASK-2.1) ----

  class EffectsEngine {

    constructor(canvas, mibera, drug, dose, ruleData) {
      this.canvas   = canvas;
      this.ctx      = canvas.getContext("2d");
      this.mibera   = mibera;
      this.drug     = drug;
      this.dose     = dose;
      this.ruleData = ruleData || {};
      this.t        = 0;
      this.lastTs   = 0;
      this.rafId      = null;
      this.image      = null;
      this._onResize  = null;
      this._boundTick = this._tick.bind(this);  // MEDIUM-002: cache once, not per-frame

      // MEDIUM-003: rolling dt average (5 frames) for performance guard
      this._dtHistory    = [];
      this._dtAvgMs      = 16;
      this._dropCooldown = 0;  // frames before next drop or recover is allowed
      this._warpBuf      = null;  // MEDIUM-004: reusable pixel buffer for pixelWarp
      this._warpBufSize  = 0;

      var doseIntensity = { first_time: 0.4, experienced: 0.75, fuck_me_up: 1.0 };
      this.intensity = doseIntensity[dose] || 0.75;

      this.deviceTier    = this._detectTier();
      this.activeEffects = selectEffects(mibera, drug, dose, this.ruleData, this.deviceTier);
      // MEDIUM-003: keep a full-priority list for recovery
      this._allEffects   = this.activeEffects.slice();
      var doseMod = this.ruleData.dose_modifiers && this.ruleData.dose_modifiers[dose];
      this._maxEffects   = Math.min(doseMod ? doseMod.max_effects : 5, this.deviceTier === "low" ? 4 : 6);
      this.palette        = selectPalette(drug, mibera, this.ruleData);
      this.bubbles        = this._initBubbles();
      this.fumeParticles  = this._initFumeParticles();

      this._resize();
    }

    // Device tier detection — quick canvas benchmark
    _detectTier() {
      try {
        var tc = document.createElement("canvas");
        tc.width = 100; tc.height = 100;
        var cx = tc.getContext("2d");
        var start = performance.now();
        for (var i = 0; i < 500; i++) {
          cx.fillRect(Math.random() * 100, Math.random() * 100, 8, 8);
        }
        return (performance.now() - start) < 10 ? "high" : "low";
      } catch (e) {
        return "low";
      }
    }

    // Build thought bubble state from pool + trait-specific phrases
    _initBubbles() {
      var pool = (this.ruleData.thought_bubble_pool || [
        "did i take too much", "everyone can tell", "am i the teddy bear",
        "what time is it actually", "i should drink some water",
        "the ceiling is moving", "i love everyone here", "what was i saying"
      ]).slice();

      var m = this.mibera;
      // NEW-LOW-001: length-guard trait strings before canvas display
      if (m.item && m.item !== "none" && m.item !== "") {
        var item = String(m.item).slice(0, 40);
        pool.push("the " + item + " is watching");
        pool.push("did the " + item + " just move");
      }
      if (m.hat && m.hat !== "none" && m.hat !== "") {
        var hat = String(m.hat).slice(0, 40);
        pool.push("the " + hat + " knows too much");
      }

      var count = this.dose === "fuck_me_up" ? 4 : this.dose === "experienced" ? 2 : 1;
      var bubbles = [];
      for (var i = 0; i < count; i++) {
        bubbles.push({
          text:       pool[Math.floor(Math.random() * pool.length)],
          x:          0.25 + Math.random() * 0.5,
          y:          0.07 + Math.random() * 0.28,
          phase:      Math.random() * Math.PI * 2,
          speed:      2.5 + Math.random() * 4,
          nextChange: 4 + Math.random() * 5,
          pool:       pool
        });
      }
      return bubbles;
    }

    // Initialise fume particle pool for chillFume effect (TASK-3.1)
    _initFumeParticles() {
      var count = 12;
      var particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x:      0.2 + Math.random() * 0.6,
          y:      0.7 + Math.random() * 0.25,
          r:      4 + Math.random() * 8,
          rise:   0.4 + Math.random() * 0.3,
          wobble: 0.4 + Math.random() * 0.6,
          phase:  Math.random() * Math.PI * 2,
          born:   -(Math.random() * 4),   // stagger birth times
          life:   3 + Math.random() * 3
        });
      }
      return particles;
    }

    // Respawn fume particles that have expired
    _tickFume() {
      var t = this.t;
      for (var i = 0; i < this.fumeParticles.length; i++) {
        var p = this.fumeParticles[i];
        if ((t - p.born) / p.life > 1) {
          p.x    = 0.2 + Math.random() * 0.6;
          p.y    = 0.7 + Math.random() * 0.25;
          p.born = t;
          p.life = 3 + Math.random() * 3;
        }
      }
    }

    _resize() {
      var maxW = Math.min(window.innerWidth * 0.9, 600);
      this.canvas.width  = maxW;
      this.canvas.height = maxW;
    }

    start(image) {
      this.image  = image;
      this.lastTs = performance.now();
      this._onResize = this._resize.bind(this);
      window.addEventListener("resize", this._onResize);
      this.rafId = requestAnimationFrame(this._boundTick);
    }

    stop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this._onResize) {
        window.removeEventListener("resize", this._onResize);
        this._onResize = null;
      }
      this.canvas.style.filter = "";
    }

    _tick(ts) {
      if (!this.rafId) return;

      var dt = ts - this.lastTs;
      this.lastTs = ts;

      // MEDIUM-003: rolling 5-frame average dt — prevents false drops from GC/tab pauses
      this._dtHistory.push(dt);
      if (this._dtHistory.length > 5) this._dtHistory.shift();
      this._dtAvgMs = this._dtHistory.reduce(function (a, b) { return a + b; }, 0) / this._dtHistory.length;

      if (this._dropCooldown > 0) {
        this._dropCooldown--;
      } else if (this._dtAvgMs > 45 && this.t > 1.5 && this.activeEffects.length > 2) {
        // Sustained lag — drop one effect, wait 30 frames before acting again
        this.activeEffects.pop();
        this._dropCooldown = 30;
      } else if (this._dtAvgMs < 22 && this.t > 3 && this.activeEffects.length < this._maxEffects) {
        // Sustained headroom — recover one effect
        var candidates = this._allEffects.filter(function (e) {
          return this.activeEffects.indexOf(e) === -1;
        }.bind(this));
        if (candidates.length > 0) {
          this.activeEffects.push(candidates[0]);
          this._dropCooldown = 30;
        }
      }

      this.t += dt * 0.001;  // seconds

      var W = this.canvas.width;
      var H = this.canvas.height;

      // Clear + dark base
      this.ctx.clearRect(0, 0, W, H);
      this.ctx.fillStyle = "#050508";
      this.ctx.fillRect(0, 0, W, H);

      // Draw image with warp effects (TASK-2.2: breathingWarp, gravitySag, chromaticAberration)
      if (this.image) {
        this._drawImage(W, H);
      }

      // Canvas overlay effects
      var active = this.activeEffects;
      var params = { bubbles: this.bubbles, fumeParticles: this.fumeParticles };

      if (active.indexOf("amberVignette") !== -1) {
        EFFECTS.amberVignette(this.ctx, this.t, this.intensity, this.palette, W, H);
      }
      if (active.indexOf("rippleWaves") !== -1) {
        EFFECTS.rippleWaves(this.ctx, this.t, this.intensity, this.palette, W, H);
      }
      if (active.indexOf("thoughtBubbles") !== -1) {
        this._tickBubbles(dt);
        EFFECTS.thoughtBubbles(this.ctx, this.t, this.intensity, this.palette, W, H, params);
      }
      // Sprint 3 effects
      if (active.indexOf("tunnelVortex") !== -1) {
        EFFECTS.tunnelVortex(this.ctx, this.t, this.intensity, this.palette, W, H);
      }
      if (active.indexOf("eyeDilation") !== -1) {
        EFFECTS.eyeDilation(this.ctx, this.t, this.intensity, this.palette, W, H);
      }
      if (active.indexOf("mandala") !== -1) {
        EFFECTS.mandala(this.ctx, this.t, this.intensity, this.palette, W, H);
      }
      if (active.indexOf("thoughtSpiral") !== -1) {
        EFFECTS.thoughtSpiral(this.ctx, this.t, this.intensity, this.palette, W, H, params);
      }
      if (active.indexOf("shadowFigures") !== -1) {
        EFFECTS.shadowFigures(this.ctx, this.t, this.intensity, this.palette, W, H);
      }
      if (active.indexOf("chillFume") !== -1) {
        this._tickFume();
        EFFECTS.chillFume(this.ctx, this.t, this.intensity, this.palette, W, H, params);
      }

      // CSS filter layer: colorShift + auraBreathing (TASK-2.2)
      this._applyCSS(active);

      this.rafId = requestAnimationFrame(this._boundTick);
    }

    // Route image drawing to the appropriate warp function
    _drawImage(W, H) {
      var active = this.activeEffects;
      try {
        if (active.indexOf("pixelWarp") !== -1 && this.deviceTier === "high") {
          this._drawPixelWarp(W, H);
        } else if (active.indexOf("glitchBars") !== -1) {
          this._drawGlitch(W, H);
        } else if (active.indexOf("chromaticAberration") !== -1) {
          this._drawChrom(W, H);
        } else {
          var scaleB = active.indexOf("breathingWarp") !== -1
            ? 1 + 0.04 * Math.sin(this.t * 1.5) * this.intensity
            : 1;
          var sagH = active.indexOf("gravitySag") !== -1
            ? 0.016 * Math.abs(Math.sin(this.t * 0.7)) * this.intensity * H
            : 0;
          var dW = W * scaleB;
          var dH = H * scaleB + sagH;
          this.ctx.drawImage(this.image, (W - dW) / 2, (H - dH) / 2, dW, dH);
        }
      } catch (e) {
        // SecurityError from CORS taint — disable image, effects continue on dark bg
        this.image = null;
      }
    }

    // glitchBars — random horizontal slice offsets (TASK-3.1)
    _drawGlitch(W, H) {
      // Base draw first
      this.ctx.drawImage(this.image, 0, 0, W, H);
      // Glitch slices — only trigger on occasional frames
      if (Math.sin(this.t * 7.3) < (0.5 - this.intensity * 0.3)) return;
      var bars = Math.round(2 + this.intensity * 4);
      for (var i = 0; i < bars; i++) {
        var sy  = Math.random() * H;
        var sh  = 3 + Math.random() * 18;
        var dx  = (Math.random() - 0.5) * 22 * this.intensity;
        this.ctx.drawImage(this.image, 0, sy, W, sh, dx, sy, W, sh);
      }
    }

    // pixelWarp — pixel displacement via getImageData (high-tier desktop only) (TASK-3.1)
    _drawPixelWarp(W, H) {
      this.ctx.drawImage(this.image, 0, 0, W, H);
      try {
        var imgData = this.ctx.getImageData(0, 0, W, H);
        var src = imgData.data;
        // MEDIUM-004: reuse buffer across frames, resize only on canvas dimension change
        var needed = src.length;
        if (!this._warpBuf || this._warpBufSize !== needed) {
          this._warpBuf = new Uint8ClampedArray(needed);
          this._warpBufSize = needed;
        }
        var out = this._warpBuf;
        var amp = Math.round(this.intensity * 8 * Math.abs(Math.sin(this.t * 0.7)));
        for (var y = 0; y < H; y++) {
          var wobble = Math.round(Math.sin(y * 0.08 + this.t * 1.2) * amp);
          var srcY = Math.max(0, Math.min(H - 1, y + wobble));
          var dstIdx = y * W * 4;
          var srcIdx = srcY * W * 4;
          for (var x = 0; x < W * 4; x++) {
            out[dstIdx + x] = src[srcIdx + x];
          }
        }
        imgData.data.set(out);
        this.ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        // Canvas taint fallback — silently degrade to plain draw
      }
    }

    // Chromatic aberration: triple-draw with RGB channel offset (TASK-2.2)
    _drawChrom(W, H) {
      var offset = Math.round(this.intensity * 7 * Math.abs(Math.sin(this.t * 0.9)));
      this.ctx.save();
      this.ctx.globalCompositeOperation = "screen";
      this.ctx.globalAlpha = 0.55;
      this.ctx.drawImage(this.image, -offset, 0, W, H);  // red channel left
      this.ctx.drawImage(this.image,       0, 0, W, H);  // green channel center
      this.ctx.drawImage(this.image,  offset, 0, W, H);  // blue channel right
      this.ctx.restore();
    }

    // CSS filter composition: colorShift + auraBreathing (TASK-2.2)
    _applyCSS(active) {
      var filters = [];
      if (active.indexOf("colorShift") !== -1) {
        var drift = Math.sin(this.t * 0.28) * 25 * this.intensity;
        filters.push("hue-rotate(" + drift.toFixed(0) + "deg)");
        var sat = 1 + 0.35 * Math.sin(this.t * 0.5) * this.intensity;
        filters.push("saturate(" + sat.toFixed(2) + ")");
      }
      if (active.indexOf("auraBreathing") !== -1) {
        var blur = (0.4 + 1.5 * Math.abs(Math.sin(this.t * 0.8))) * this.intensity;
        var glow = hexAlpha(this.palette.hex || "#c49a1a", 0.7);
        filters.push("drop-shadow(0 0 " + blur.toFixed(1) + "px " + glow + ")");
      }
      this.canvas.style.filter = filters.join(" ");
    }

    // Rotate thought bubble text + reposition on timer
    _tickBubbles(dt) {
      var dtS = dt * 0.001;
      for (var i = 0; i < this.bubbles.length; i++) {
        var b = this.bubbles[i];
        b.nextChange -= dtS;
        if (b.nextChange <= 0) {
          b.text       = b.pool[Math.floor(Math.random() * b.pool.length)];
          b.x          = 0.15 + Math.random() * 0.7;
          b.y          = 0.05 + Math.random() * 0.3;
          b.phase      = this.t;
          b.nextChange = 4 + Math.random() * 6;
        }
      }
    }

  }  // end EffectsEngine

})();
