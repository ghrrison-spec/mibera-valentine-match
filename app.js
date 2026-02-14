// Mibera Valentine Match — Frontend Logic
// Zero dependencies. Lazy-loads JSON data on first search.

(function () {
  "use strict";

  // === State ===
  var miberaData = null;
  var matchData = null;
  var isLoading = false;

  // === DOM Elements ===
  var form = document.getElementById("search-form");
  var input = document.getElementById("token-input");
  var btn = document.getElementById("search-btn");
  var loadingEl = document.getElementById("loading");
  var errorEl = document.getElementById("error");
  var errorMsg = document.getElementById("error-msg");
  var resultsEl = document.getElementById("results");
  var tryAnotherBtn = document.getElementById("try-another-btn");

  // Key traits to highlight (shown with accent color)
  var KEY_TRAITS = ["archetype", "sun_sign", "element", "moon_sign", "ascending_sign"];

  // Display-friendly trait names and order
  var DISPLAY_TRAITS = [
    ["archetype", "Archetype"],
    ["sun_sign", "Sun Sign"],
    ["moon_sign", "Moon Sign"],
    ["ascending_sign", "Ascending Sign"],
    ["element", "Element"],
    ["drug", "Drug"],
    ["drug_suit", "Tarot Suit"],
    ["ancestor", "Ancestor"],
    ["time_period", "Time Period"],
    ["background", "Background"],
    ["swag_rank", "Swag Rank"],
    ["swag_score", "Swag Score"],
    ["body", "Body"],
    ["hair", "Hair"],
    ["eyes", "Eyes"],
    ["mouth", "Mouth"],
    ["shirt", "Shirt"],
    ["hat", "Hat"],
    ["glasses", "Glasses"],
    ["earrings", "Earrings"],
    ["mask", "Mask"],
    ["tattoo", "Tattoo"],
    ["item", "Item"],
  ];

  // === Event Listeners ===
  form.addEventListener("submit", handleSearch);
  tryAnotherBtn.addEventListener("click", handleTryAnother);

  // === Search ===
  async function handleSearch(e) {
    e.preventDefault();
    if (isLoading) return;

    var id = input.value.trim();
    if (!id) return;

    var num = parseInt(id, 10);
    if (isNaN(num) || num < 1 || num > 10000) {
      showError("Enter a number between 1 and 10,000");
      return;
    }

    hideError();
    hideResults();

    try {
      await ensureDataLoaded();
    } catch (err) {
      showError("Unable to load Mibera data. Try refreshing the page.");
      return;
    }

    var tokenId = String(num);
    var mibera = miberaData[tokenId];
    var match = matchData[tokenId];

    if (!mibera || !match) {
      showError("Mibera #" + tokenId + " not found.");
      return;
    }

    var matchedMibera = miberaData[String(match.match_id)];
    if (!matchedMibera) {
      showError("Match data error. Try another Mibera.");
      return;
    }

    renderMatch(mibera, matchedMibera, match);
  }

  // === Try Another ===
  function handleTryAnother() {
    hideResults();
    hideError();
    input.value = "";
    input.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // === Data Loading ===
  async function ensureDataLoaded() {
    if (miberaData && matchData) return;

    isLoading = true;
    showLoading();
    btn.disabled = true;

    try {
      var responses = await Promise.all([
        fetch("data/miberas.json"),
        fetch("data/matches.json"),
      ]);

      if (!responses[0].ok || !responses[1].ok) {
        throw new Error("Failed to fetch data");
      }

      var results = await Promise.all([
        responses[0].json(),
        responses[1].json(),
      ]);

      miberaData = results[0];
      matchData = results[1];
    } finally {
      isLoading = false;
      hideLoading();
      btn.disabled = false;
    }
  }

  // === Rendering ===
  function renderMatch(left, right, match) {
    setupImage("img-left", "fallback-left", left.image, left.name);
    setupImage("img-right", "fallback-right", right.image, right.name);

    document.getElementById("name-left").textContent = left.name;
    document.getElementById("name-right").textContent = right.name;

    document.getElementById("traits-left").innerHTML = buildTraitHTML(left);
    document.getElementById("traits-right").innerHTML = buildTraitHTML(right);

    var scoreEl = document.getElementById("match-score");
    scoreEl.textContent = Math.round(match.score) + "% compatible";

    document.getElementById("explanation").textContent = match.explanation;

    resultsEl.hidden = false;
    resultsEl.style.animation = "none";
    resultsEl.offsetHeight;
    resultsEl.style.animation = "";
  }

  function setupImage(imgId, fallbackId, src, name) {
    var img = document.getElementById(imgId);
    var fallback = document.getElementById(fallbackId);

    img.hidden = false;
    fallback.hidden = true;
    img.alt = name;
    img.src = src;

    img.onerror = function () {
      img.hidden = true;
      fallback.hidden = false;
      fallback.textContent = name;
    };
  }

  function buildTraitHTML(mibera) {
    var html = "";
    for (var i = 0; i < DISPLAY_TRAITS.length; i++) {
      var key = DISPLAY_TRAITS[i][0];
      var label = DISPLAY_TRAITS[i][1];
      var value = mibera[key];

      if (!value || value === "none" || value === "") continue;

      var isHighlight = KEY_TRAITS.indexOf(key) !== -1;
      var valueClass = isHighlight ? "trait-value trait-highlight" : "trait-value";

      html +=
        '<div class="trait-row">' +
        '<span class="trait-label">' + escapeHTML(label) + "</span>" +
        '<span class="' + valueClass + '">' + escapeHTML(capitalize(value)) + "</span>" +
        "</div>";
    }
    return html;
  }

  // === Utilities ===
  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function showLoading() { loadingEl.hidden = false; }
  function hideLoading() { loadingEl.hidden = true; }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorEl.hidden = false;
    resultsEl.hidden = true;
  }

  function hideError() { errorEl.hidden = true; }
  function hideResults() { resultsEl.hidden = true; }

  // =========================================================
  // Background Effect: Falling Glowing Red Triangles
  // =========================================================
  (function initBackground() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var triangles = [];
    var COUNT = 18;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function createTriangle() {
      var size = 8 + Math.random() * 22;
      return {
        x: Math.random() * canvas.width,
        y: -size - Math.random() * canvas.height,
        size: size,
        speed: 0.15 + Math.random() * 0.35,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        opacity: 0.04 + Math.random() * 0.08,
        drift: (Math.random() - 0.5) * 0.2,
        hue: 340 + Math.random() * 20, // dark red-crimson range
      };
    }

    for (var i = 0; i < COUNT; i++) {
      var t = createTriangle();
      t.y = Math.random() * canvas.height; // spread initially
      triangles.push(t);
    }

    function drawTriangle(t) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);
      ctx.globalAlpha = t.opacity;

      // Glow
      ctx.shadowColor = "hsla(" + t.hue + ", 70%, 25%, 0.6)";
      ctx.shadowBlur = 25 + t.size;

      // Triangle path
      ctx.beginPath();
      ctx.moveTo(0, -t.size);
      ctx.lineTo(-t.size * 0.866, t.size * 0.5);
      ctx.lineTo(t.size * 0.866, t.size * 0.5);
      ctx.closePath();

      // Stroke only (hollow triangles)
      ctx.strokeStyle = "hsla(" + t.hue + ", 60%, 22%, 1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle ambient glow in center
      var grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.7
      );
      grd.addColorStop(0, "rgba(60, 10, 25, 0.06)");
      grd.addColorStop(1, "rgba(5, 5, 8, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < triangles.length; i++) {
        var t = triangles[i];
        t.y += t.speed;
        t.x += t.drift;
        t.rotation += t.rotSpeed;

        if (t.y > canvas.height + t.size * 2) {
          triangles[i] = createTriangle();
        }

        drawTriangle(t);
      }

      requestAnimationFrame(animate);
    }

    animate();
  })();

})();
