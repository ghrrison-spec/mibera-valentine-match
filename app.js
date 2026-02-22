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
    ["eyebrows", "Eyebrows"],
    ["mouth", "Mouth"],
    ["shirt", "Shirt"],
    ["hat", "Hat"],
    ["glasses", "Glasses"],
    ["mask", "Mask"],
    ["earrings", "Earrings"],
    ["face_accessory", "Face Accessory"],
    ["tattoo", "Tattoo"],
    ["item", "Item"],
  ];

  // === Event Listeners ===
  form.addEventListener("submit", handleSearch);

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

    img.onerror = function () {
      img.hidden = true;
      fallback.hidden = false;
      fallback.textContent = name;
    };

    img.src = src;
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
  // Static Background: Gothic Cityscape + Cultist Pyramids
  // Drawn once on load/resize. No animation loop.
  // =========================================================
  (function initBackground() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var sil = "#030106";  // silhouette color
    var sil2 = "#050209"; // slightly lighter for depth layers

    function draw() {
      var W = canvas.width = window.innerWidth;
      var H = canvas.height = window.innerHeight;
      var ground = H * 0.78;

      // --- Sky ---
      var sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#04010a");
      sky.addColorStop(0.3, "#070312");
      sky.addColorStop(0.6, "#0b0514");
      sky.addColorStop(0.85, "#0f0810");
      sky.addColorStop(1, "#06030a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Horizon glow
      var glow = ctx.createRadialGradient(W * 0.5, ground, 0, W * 0.5, ground, W * 0.55);
      glow.addColorStop(0, "rgba(110, 12, 35, 0.1)");
      glow.addColorStop(0.4, "rgba(70, 8, 22, 0.05)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // --- Helpers ---
      function pointedArch(cx, botY, w, h) {
        // Realistic lancet arch
        ctx.moveTo(cx - w / 2, botY);
        ctx.lineTo(cx - w / 2, botY - h * 0.5);
        ctx.quadraticCurveTo(cx - w / 2, botY - h, cx, botY - h);
        ctx.quadraticCurveTo(cx + w / 2, botY - h, cx + w / 2, botY - h * 0.5);
        ctx.lineTo(cx + w / 2, botY);
      }

      function roseWindow(cx, cy, r) {
        // Circle with inner tracery spokes
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = "#8b1a3a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        // Inner ring
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        // Spokes
        for (var a = 0; a < 8; a++) {
          var angle = a * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * r * 0.6, cy + Math.sin(angle) * r * 0.6);
          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
          ctx.stroke();
        }
        // Faint fill
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = "#8b1a3a";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function spire(cx, baseW, tipY, bodyTopY) {
        // Tapered spire with finial
        ctx.beginPath();
        ctx.moveTo(cx - baseW / 2, bodyTopY);
        ctx.lineTo(cx - baseW * 0.08, bodyTopY - (bodyTopY - tipY) * 0.6);
        ctx.lineTo(cx, tipY);
        ctx.lineTo(cx + baseW * 0.08, bodyTopY - (bodyTopY - tipY) * 0.6);
        ctx.lineTo(cx + baseW / 2, bodyTopY);
        ctx.closePath();
        ctx.fill();
        // Finial cross
        ctx.strokeStyle = sil;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, tipY);
        ctx.lineTo(cx, tipY - 6);
        ctx.moveTo(cx - 3, tipY - 4);
        ctx.lineTo(cx + 3, tipY - 4);
        ctx.stroke();
      }

      function pinnacle(cx, botY, w, h) {
        // Small decorative pinnacle
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, botY);
        ctx.lineTo(cx - w * 0.15, botY - h * 0.6);
        ctx.lineTo(cx, botY - h);
        ctx.lineTo(cx + w * 0.15, botY - h * 0.6);
        ctx.lineTo(cx + w / 2, botY);
        ctx.closePath();
        ctx.fill();
      }

      function buttress(x, topY, botY, topW, botW) {
        // Flying buttress shape
        ctx.beginPath();
        ctx.moveTo(x - topW / 2, topY);
        ctx.lineTo(x - botW / 2, botY);
        ctx.lineTo(x + botW / 2, botY);
        ctx.lineTo(x + topW / 2, topY);
        ctx.closePath();
        ctx.fill();
      }

      function windowRow(x, y, count, w, h, gap) {
        ctx.save();
        ctx.globalAlpha = 0.035;
        ctx.fillStyle = "#8b1a3a";
        for (var i = 0; i < count; i++) {
          var cx = x + i * (w + gap) + w / 2;
          ctx.beginPath();
          pointedArch(cx, y, w, h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // --- Background layer (distant buildings, lighter) ---
      ctx.fillStyle = sil2;
      var distGround = ground - H * 0.01;

      // Distant left tower
      ctx.fillRect(W * 0.05, distGround - H * 0.18, W * 0.04, H * 0.18);
      pinnacle(W * 0.07, distGround - H * 0.18, W * 0.02, H * 0.06);

      // Distant right abbey
      ctx.fillRect(W * 0.82, distGround - H * 0.13, W * 0.1, H * 0.13);
      pinnacle(W * 0.84, distGround - H * 0.13, W * 0.015, H * 0.07);
      pinnacle(W * 0.9, distGround - H * 0.13, W * 0.015, H * 0.07);

      // Distant center chapel
      ctx.fillRect(W * 0.28, distGround - H * 0.1, W * 0.08, H * 0.1);
      pinnacle(W * 0.32, distGround - H * 0.1, W * 0.02, H * 0.09);

      // --- Main layer (foreground architecture) ---
      ctx.fillStyle = sil;

      // === Left: Ruined tower ===
      var ltx = W * 0.08;
      ctx.fillRect(ltx, ground - H * 0.25, W * 0.05, H * 0.25);
      // Uneven top (ruined)
      ctx.fillRect(ltx, ground - H * 0.28, W * 0.025, H * 0.03);
      ctx.fillRect(ltx + W * 0.035, ground - H * 0.27, W * 0.015, H * 0.02);
      // Arch window
      windowRow(ltx + W * 0.005, ground - H * 0.05, 1, W * 0.02, H * 0.04, 0);
      windowRow(ltx + W * 0.005, ground - H * 0.14, 1, W * 0.015, H * 0.03, 0);

      // === Left: Connected wall with buttresses ===
      ctx.fillRect(ltx + W * 0.05, ground - H * 0.1, W * 0.1, H * 0.1);
      buttress(ltx + W * 0.07, ground - H * 0.1, ground, W * 0.008, W * 0.02);
      buttress(ltx + W * 0.1, ground - H * 0.1, ground, W * 0.008, W * 0.02);
      buttress(ltx + W * 0.13, ground - H * 0.1, ground, W * 0.008, W * 0.02);
      windowRow(ltx + W * 0.055, ground - H * 0.02, 3, W * 0.018, H * 0.035, W * 0.012);

      // === Center: Main Cathedral ===
      var catX = W * 0.33;
      var catW = W * 0.34;
      var naveH = H * 0.2;
      var naveTop = ground - naveH;

      // Nave body
      ctx.fillRect(catX, naveTop, catW, naveH);

      // Pitched roof
      ctx.beginPath();
      ctx.moveTo(catX, naveTop);
      ctx.lineTo(catX + catW * 0.5, naveTop - H * 0.06);
      ctx.lineTo(catX + catW, naveTop);
      ctx.closePath();
      ctx.fill();

      // Transept wings
      var txW = W * 0.04;
      ctx.fillRect(catX - txW, ground - H * 0.15, txW, H * 0.15);
      ctx.fillRect(catX + catW, ground - H * 0.15, txW, H * 0.15);

      // Main twin towers (west facade)
      var towerW = W * 0.045;
      var towerH = H * 0.35;
      var towerLx = catX + catW * 0.15;
      var towerRx = catX + catW * 0.85 - towerW;

      ctx.fillRect(towerLx, ground - towerH, towerW, towerH);
      ctx.fillRect(towerRx, ground - towerH, towerW, towerH);

      // Tower spires
      spire(towerLx + towerW / 2, towerW * 0.8, ground - towerH - H * 0.12, ground - towerH);
      spire(towerRx + towerW / 2, towerW * 0.8, ground - towerH - H * 0.12, ground - towerH);

      // Central spire (taller, over crossing)
      var centralCx = catX + catW * 0.5;
      spire(centralCx, W * 0.03, ground - H * 0.52, naveTop - H * 0.06);

      // Pinnacles along roofline
      var pinCount = 8;
      for (var p = 0; p < pinCount; p++) {
        var px = catX + catW * (p + 0.5) / pinCount;
        pinnacle(px, naveTop, W * 0.008, H * 0.03);
      }

      // Pinnacles on towers
      pinnacle(towerLx, ground - towerH, W * 0.008, H * 0.025);
      pinnacle(towerLx + towerW, ground - towerH, W * 0.008, H * 0.025);
      pinnacle(towerRx, ground - towerH, W * 0.008, H * 0.025);
      pinnacle(towerRx + towerW, ground - towerH, W * 0.008, H * 0.025);

      // Rose window (center facade)
      roseWindow(centralCx, ground - naveH + H * 0.02, Math.min(W * 0.035, H * 0.04));

      // Lancet windows on nave
      windowRow(catX + W * 0.02, ground - H * 0.02, 6, W * 0.02, H * 0.06, W * 0.025);

      // Tower windows
      windowRow(towerLx + W * 0.005, ground - H * 0.05, 1, W * 0.02, H * 0.05, 0);
      windowRow(towerLx + W * 0.005, ground - H * 0.18, 1, W * 0.015, H * 0.04, 0);
      windowRow(towerLx + W * 0.005, ground - H * 0.28, 1, W * 0.012, H * 0.03, 0);
      windowRow(towerRx + W * 0.008, ground - H * 0.05, 1, W * 0.02, H * 0.05, 0);
      windowRow(towerRx + W * 0.008, ground - H * 0.18, 1, W * 0.015, H * 0.04, 0);
      windowRow(towerRx + W * 0.008, ground - H * 0.28, 1, W * 0.012, H * 0.03, 0);

      // Flying buttresses along nave sides
      for (var b = 0; b < 5; b++) {
        var bx = catX - W * 0.025 + (b * catW * 0.22);
        buttress(catX - W * 0.01, naveTop + H * 0.04, ground - H * 0.02, W * 0.006, W * 0.015);
      }
      // Right side buttresses
      for (var b2 = 0; b2 < 4; b2++) {
        var bx2 = catX + catW + W * 0.005;
        buttress(bx2, naveTop + H * 0.05 + b2 * H * 0.03, ground - H * 0.01, W * 0.005, W * 0.012);
      }

      // === Right: Chapter house / cloister ===
      var rx = W * 0.75;
      ctx.fillRect(rx, ground - H * 0.14, W * 0.12, H * 0.14);
      // Battlements
      var bw = W * 0.12 / 9;
      for (var m = 0; m < 9; m += 2) {
        ctx.fillRect(rx + m * bw, ground - H * 0.14 - bw * 0.6, bw, bw * 0.6);
      }
      pinnacle(rx + W * 0.06, ground - H * 0.14 - bw * 0.6, W * 0.015, H * 0.08);
      windowRow(rx + W * 0.01, ground - H * 0.02, 3, W * 0.018, H * 0.04, W * 0.012);

      // === Far right: bell tower ===
      ctx.fillRect(W * 0.92, ground - H * 0.22, W * 0.04, H * 0.22);
      pinnacle(W * 0.94, ground - H * 0.22, W * 0.025, H * 0.1);
      windowRow(W * 0.925, ground - H * 0.12, 1, W * 0.02, H * 0.04, 0);

      // --- Ground ---
      ctx.fillStyle = sil;
      ctx.fillRect(0, ground, W, H - ground);

      // --- Cultist pyramids / triangles scattered in sky ---
      var rng = function(s) { return function() { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
      var rand = rng(6661);

      for (var t = 0; t < 15; t++) {
        var tx = rand() * W;
        var ty = rand() * ground * 0.7;
        var ts = 14 + rand() * 35;
        var rot = (rand() - 0.5) * 0.4; // slight tilt, mostly upright
        var op = 0.04 + rand() * 0.08;
        var filled = rand() < 0.35;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rot);
        ctx.globalAlpha = op;

        ctx.beginPath();
        ctx.moveTo(0, -ts * 1.3);
        ctx.lineTo(-ts * 0.55, ts * 0.5);
        ctx.lineTo(ts * 0.55, ts * 0.5);
        ctx.closePath();

        if (filled) {
          ctx.fillStyle = "rgba(70, 8, 25, 0.7)";
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(139, 26, 58, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eye-of-providence inner triangle on some
        if (rand() < 0.25) {
          var ins = ts * 0.3;
          ctx.beginPath();
          ctx.moveTo(0, -ins * 0.7);
          ctx.lineTo(-ins * 0.45, ins * 0.35);
          ctx.lineTo(ins * 0.45, ins * 0.35);
          ctx.closePath();
          ctx.strokeStyle = "rgba(92, 33, 117, 0.35)";
          ctx.lineWidth = 0.7;
          ctx.stroke();
          // Dot (eye)
          ctx.beginPath();
          ctx.arc(0, ins * 0.05, ins * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(139, 26, 58, 0.3)";
          ctx.fill();
        }

        ctx.restore();
      }
    }

    draw();
    window.addEventListener("resize", draw);
  })();

})();
