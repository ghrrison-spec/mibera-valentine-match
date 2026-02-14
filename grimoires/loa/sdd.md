# SDD: Mibera Valentine Match

> **Version:** 1.0
> **Created:** 2026-02-14
> **Based on:** PRD v1.0

## 1. Executive Summary

A single-page static website that matches Mibera NFTs as Valentine's dates. All matching is pre-computed via a Node.js build script; the runtime is pure HTML/CSS/JS with zero dependencies. Two JSON data files are lazy-loaded on first search for instant lookup.

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BUILD TIME (Node.js)                  │
│                                                         │
│  mibera_all_traits.csv ──┐                              │
│                          ├──→ build.js ──→ miberas.json │
│  mibera-codex/ lore ─────┘              ──→ matches.json│
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   RUNTIME (Static Site)                  │
│                                                         │
│  index.html ─── style.css ─── app.js                    │
│                     │                                    │
│              fetch on first search                       │
│                     │                                    │
│              data/miberas.json                           │
│              data/matches.json                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Two distinct phases:**
1. **Build phase** — Node.js script parses CSV + codex lore, runs matching algorithm, generates JSON files
2. **Runtime phase** — Static HTML/CSS/JS serves the UI, fetches JSON on demand

## 3. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Build script | Node.js | Parse CSV, process lore, generate JSON. Already available, no extra deps. |
| CSV parsing | `csv-parse` (npm) | Robust CSV parser for the 10K-row file |
| Frontend | HTML / CSS / JS | PRD requirement: no framework, static site |
| Hosting | Any static host | GitHub Pages, Vercel, Netlify, or local file:// |

No frontend framework. No bundler. No TypeScript. The build script is the only place that uses Node.js.

## 4. Project Structure

```
my-project/
├── index.html              # Single page
├── style.css               # All styles
├── app.js                  # Runtime logic (~150 lines)
├── data/
│   ├── miberas.json        # Generated: 10K entries (token → traits)
│   └── matches.json        # Generated: 10K entries (token → match)
├── build/
│   ├── build.js            # Main build script
│   ├── matching.js         # Matching algorithm
│   ├── templates.js        # Explanation text templates
│   └── lore.js             # Codex lore parser (drug→suit mappings)
├── codex/                  # Copied lore files from mibera-codex repo
│   ├── archetypes.md
│   ├── drug-tarot-system.md
│   └── philosophy.md
└── package.json            # Only for build script deps (csv-parse)
```

## 5. Data Architecture

### 5.1 miberas.json

Keyed by token ID for O(1) lookup. Only the traits needed for display and matching — visual-only traits (body, hair, etc.) included for the trait card but not for the algorithm.

```json
{
  "1": {
    "name": "Mibera 1",
    "image": "https://gateway.irys.xyz/7rpv.../8a7e...png",
    "archetype": "freetekno",
    "sun_sign": "cancer",
    "moon_sign": "leo",
    "ascending_sign": "scorpio",
    "element": "earth",
    "drug": "st. john's wort",
    "drug_suit": "pentacles",
    "ancestor": "greek",
    "swag_rank": "B",
    "swag_score": 41,
    "time_period": "modern",
    "background": "fyre festival",
    "body": "umber",
    "hair": "afro",
    "eyes": "normal grey",
    "eyebrows": "anxious thick",
    "mouth": "cig",
    "shirt": "htrk night faces",
    "hat": "none",
    "glasses": "red sunglasses",
    "mask": "none",
    "earrings": "none",
    "face_accessory": "fluoro pink",
    "tattoo": "none",
    "item": "beads",
    "grail": ""
  }
}
```

**Estimated size:** ~3 MB minified, ~800 KB gzipped.

### 5.2 matches.json

Keyed by token ID. Stores only the match result — not the full trait data (that lives in miberas.json).

```json
{
  "1": {
    "match_id": 7891,
    "score": 87,
    "chaos": false,
    "explanation": "Mibera #1 (Freetekno, Cancer, Earth) meets Mibera #7891 (Milady, Aquarius, Air)..."
  }
}
```

**Estimated size:** ~1.5 MB minified, ~400 KB gzipped.

### 5.3 Drug-to-Tarot-Suit Mapping

Extracted from codex at build time. Stored as a lookup in `build/lore.js`:

```js
const DRUG_SUITS = {
  "mdma": "cups",
  "lsd": "swords",
  "cannabis": "pentacles",
  "amphetamine": "wands",
  "st. john's wort": "pentacles",
  // ... 78 total mappings
};
```

Suit categorization from codex:
- **Wands (Fire):** Stimulants, energizers
- **Cups (Water):** Empathogens, entheogens
- **Swords (Air):** Nootropics, dissociatives
- **Pentacles (Earth):** Sedatives, grounding substances

## 6. Matching Algorithm Design

### 6.1 Scoring Function

```
totalScore = (sunSignScore * 0.30)
           + (elementScore * 0.20)
           + (archetypeScore * 0.20)
           + (moonAscScore * 0.15)
           + (drugTarotScore * 0.10)
           + (chaosBonus * 0.05)
```

Each sub-score is normalized to 0–100.

### 6.2 Sun Sign Compatibility (30%)

Traditional zodiac compatibility matrix. Each pair of signs gets a score:

| Relationship | Score | Examples |
|-------------|-------|---------|
| Same sign | 80 | Leo + Leo |
| Same element | 90 | Leo + Aries (both Fire) |
| Complementary element | 95 | Leo (Fire) + Gemini (Air) |
| Opposite sign (across wheel) | 100 | Leo + Aquarius |
| Neutral | 60 | Leo + Virgo |
| Challenging | 40 | Leo + Scorpio |

The 12×12 matrix is hardcoded from standard astrological compatibility charts.

### 6.3 Element Pairing (20%)

| Pairing | Score | Label |
|---------|-------|-------|
| Fire + Air | 100 | Complementary |
| Water + Earth | 100 | Complementary |
| Same element | 80 | Harmonious |
| Fire + Earth | 50 | Moderate |
| Air + Water | 50 | Moderate |
| Fire + Water | 30 | Chaotic |
| Earth + Air | 30 | Chaotic |

Scores of 30 set `chaos = true` on the match.

### 6.4 Archetype Contrast (20%)

Opposites attract — different archetypes score higher:

| Pairing | Score |
|---------|-------|
| Different archetype | 100 |
| Same archetype | 40 |

Four archetypes: freetekno, milady, chicago/detroit, acidhouse.

### 6.5 Moon/Ascending Sign (15%)

Same logic as sun sign but applied to moon and ascending signs, averaged:

```
moonAscScore = (moonCompatibility + ascendingCompatibility) / 2
```

### 6.6 Drug-Tarot Suit (10%)

Complementary suits score highest:

| Pairing | Score |
|---------|-------|
| Wands + Cups (Fire + Water) | 100 |
| Swords + Pentacles (Air + Earth) | 100 |
| Same suit | 60 |
| Other combinations | 70 |

### 6.7 Chaos Factor (5%)

When `chaos = true` (Fire+Water elements or Earth+Air elements), add a bonus:

```
chaosBonus = chaos ? 100 : 0
```

This rewards matches that work despite conflicting elements — the "against all odds" factor.

### 6.8 Performance

- 10,000 × 9,999 = ~100M comparisons
- Each comparison: ~10 arithmetic operations
- Expected build time: < 30 seconds on modern hardware
- Optimization: Score function is pure arithmetic, no string ops in the hot loop

## 7. Explanation Template System

### 7.1 Template Components

Templates are composed from interchangeable parts selected by match characteristics:

```js
const explanation = [
  pickOpener(matchType, chaos),      // 1 sentence
  pickArchetypeLine(a1, a2),         // 1 sentence
  pickZodiacLine(sun1, sun2),        // 1 sentence
  pickElementLine(el1, el2, drug1, drug2), // 1 sentence
  chaos ? pickChaosLine() : "",      // conditional
  pickCloser()                       // 1 sentence
].filter(Boolean).join(" ");
```

### 7.2 Template Variety

| Component | Variants | Example |
|-----------|----------|---------|
| Openers | 15+ | "The stars aligned for this one." / "Some matches defy explanation." |
| Archetype lines | 4×4 = 16 combos | "Freetekno meets Milady — underground spirit meets digital elegance." |
| Zodiac lines | 12 sign-pair descriptions | "Leo and Aquarius: the cosmic axis of attraction." |
| Element lines | 7 combos | "Fire feeds Air and the flames grow brighter." |
| Chaos lines | 10+ | "Against all cosmic odds, chaos brought them together." |
| Closers | 15+ | "A match written in the stars — and the bassline." |

Total unique combinations: 15 × 16 × 12 × 7 × 15 = ~300K+ permutations. More than enough for 10K matches.

### 7.3 Output Format

Each explanation is 3–5 sentences, ~50–80 words. Stored as a plain string in matches.json.

## 8. Frontend Design

### 8.1 HTML Structure

Single `index.html` with three states:

1. **Landing state** — Search input visible, results hidden
2. **Results state** — Match displayed, search input remains at top
3. **Error state** — "Mibera not found" message for invalid IDs

```html
<body>
  <header><!-- Title + search input --></header>
  <main id="results" hidden>
    <div class="match-container">
      <div class="mibera-card" id="mibera-left"><!-- Image + traits --></div>
      <div class="match-badge"><!-- "It's a Match!" --></div>
      <div class="mibera-card" id="mibera-right"><!-- Image + traits --></div>
    </div>
    <div class="explanation"><!-- Why they match --></div>
  </main>
  <div id="error" hidden><!-- Invalid ID message --></div>
</body>
```

### 8.2 CSS Architecture

Single `style.css` file. No preprocessor.

**Design tokens (CSS custom properties):**

```css
:root {
  --bg-primary: #0a0a0a;
  --bg-card: #1a1a2e;
  --neon-pink: #ff2d95;
  --neon-magenta: #e040fb;
  --neon-cyan: #00e5ff;
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0b0;
  --glow-pink: 0 0 20px rgba(255, 45, 149, 0.5);
  --glow-cyan: 0 0 20px rgba(0, 229, 255, 0.5);
}
```

**Key visual effects:**
- Neon glow on "It's a Match!" text (`text-shadow` with `--neon-pink`)
- Subtle pulsing heart animation (CSS `@keyframes`)
- Card hover/reveal animation on results
- Responsive: cards stack vertically on mobile (< 768px)

### 8.3 JavaScript (app.js)

~150 lines, no dependencies:

```js
// State
let miberaData = null;  // Lazy-loaded miberas.json
let matchData = null;   // Lazy-loaded matches.json

// Entry point
document.getElementById("search-form").addEventListener("submit", handleSearch);

async function handleSearch(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("token-input").value);
  if (id < 1 || id > 10000) return showError("Enter a number between 1 and 10,000");

  await ensureDataLoaded();

  const mibera = miberaData[id];
  const match = matchData[id];
  if (!mibera || !match) return showError("Mibera not found");

  const matchedMibera = miberaData[match.match_id];
  renderMatch(mibera, matchedMibera, match);
}

async function ensureDataLoaded() {
  if (!miberaData) {
    const [m, mt] = await Promise.all([
      fetch("data/miberas.json").then(r => r.json()),
      fetch("data/matches.json").then(r => r.json())
    ]);
    miberaData = m;
    matchData = mt;
  }
}

function renderMatch(left, right, match) { /* DOM updates */ }
function showError(msg) { /* Show error div */ }
```

### 8.4 Image Handling

- Images loaded via `<img>` with `loading="lazy"` attribute
- Irys gateway URLs used directly from CSV data
- Fallback: If image fails to load, show a colored placeholder with the Mibera name
- Image size: Set `max-width: 280px` to control layout

## 9. Build Pipeline

### 9.1 Build Script (build/build.js)

```
node build/build.js
```

Steps:
1. Read and parse `mibera_all_traits.csv` using `csv-parse`
2. Read codex lore files from `codex/` directory
3. Build drug-to-tarot-suit mapping from drug-tarot-system.md
4. For each of 10,000 Miberas:
   a. Score against all other 9,999 Miberas
   b. Pick the highest-scoring match
   c. Generate explanation from templates
   d. Store result
5. Write `data/miberas.json`
6. Write `data/matches.json`
7. Print summary stats (build time, file sizes, chaos match count)

### 9.2 Build Dependencies

```json
{
  "scripts": {
    "build": "node build/build.js"
  },
  "dependencies": {
    "csv-parse": "^5.5.0"
  }
}
```

Single dependency. The `csv-parse` package handles quoted fields, commas in descriptions, etc.

### 9.3 Codex Data Preparation

Before first build, copy relevant codex files:

```bash
# One-time setup
mkdir -p codex
# Copy from cloned mibera-codex repo or download raw files
cp mibera-codex/core-lore/archetypes.md codex/
cp mibera-codex/core-lore/drug-tarot-system.md codex/
cp mibera-codex/core-lore/philosophy.md codex/
```

The build script parses these markdown files to extract:
- Drug → tarot suit mappings
- Archetype descriptions (for explanation templates)

## 10. Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| > 768px | Side-by-side cards, horizontal layout |
| ≤ 768px | Stacked cards, vertical layout, "It's a Match!" between cards |

Mobile-first CSS with `@media (min-width: 768px)` for desktop layout.

## 11. Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid token ID (< 1 or > 10,000) | Show inline error, keep search input focused |
| Non-numeric input | Show "Enter a number between 1 and 10,000" |
| JSON fetch fails | Show "Unable to load data. Try refreshing." |
| Image load fails | Show colored placeholder with Mibera name |
| Empty input | Do nothing (form validation prevents submit) |

## 12. Performance Budget

| Asset | Target | Actual (estimated) |
|-------|--------|-------------------|
| index.html | < 5 KB | ~3 KB |
| style.css | < 10 KB | ~6 KB |
| app.js | < 10 KB | ~4 KB |
| miberas.json (gzipped) | < 1 MB | ~800 KB |
| matches.json (gzipped) | < 500 KB | ~400 KB |
| **Total first load** | **< 30 KB** | **~13 KB** (before data fetch) |
| **Total with data** | **< 1.5 MB** | **~1.2 MB** (gzipped) |

Data is only fetched on first search, not on page load.

## 13. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| XSS via token input | Input parsed as integer, never inserted as HTML |
| Trait data in DOM | Text content only (`textContent`), never `innerHTML` with raw data |
| External image loading | Images from Irys gateway only, no user-supplied URLs |
| No backend | No API, no database, no server — minimal attack surface |

## 14. Deployment

The site is fully static. Deploy by copying these files to any web server:

```
index.html
style.css
app.js
data/miberas.json
data/matches.json
```

Works with GitHub Pages, Netlify, Vercel, or any static file host. Also works opened directly as a local file (with a local server for JSON fetch).

## 15. Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Build takes too long (100M comparisons) | Delays development | Profile, optimize hot loop. Fallback: pre-filter candidates by element. |
| matches.json too large | Slow mobile load | Gzip. If still too large, split by ID range and fetch only needed chunk. |
| Drug names in CSV don't match codex | Wrong tarot suit mappings | Normalize drug names (lowercase, trim) in build script. Log unmatched drugs. |
| Irys gateway rate limits | Images fail to load | Lazy-load, show trait data first. No batch prefetching. |
