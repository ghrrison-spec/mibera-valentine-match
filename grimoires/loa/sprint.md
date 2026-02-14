# Sprint Plan: Mibera Valentine Match

> **Version:** 1.0
> **Created:** 2026-02-14
> **Sprints:** 2
> **Based on:** PRD v1.0, SDD v1.0

## Overview

Two sprints. Sprint 1 builds the data pipeline and matching algorithm (build-time). Sprint 2 builds the frontend UI (runtime). Sprint 1 must complete first since the frontend depends on the generated JSON files.

---

## Sprint 1: Data Pipeline & Matching Algorithm

**Goal:** Parse CSV + codex lore, implement matching algorithm, generate `miberas.json` and `matches.json`.

### Task 1.1: Project Setup & CSV Parsing

**Description:** Initialize project structure, install `csv-parse`, write CSV parser that reads `mibera_all_traits.csv` and outputs structured Mibera objects.

**Acceptance Criteria:**
- `package.json` with `csv-parse` dependency and `npm run build` script
- `build/build.js` reads CSV and parses all 10,000 rows
- Each row becomes an object with normalized keys (snake_case, trimmed, lowercased trait values)
- Handle CSV edge cases: quoted fields, commas in description field
- Print row count to verify all 10,000 parsed

**Effort:** Small

---

### Task 1.2: Codex Lore Extraction

**Description:** Copy relevant codex markdown files into `codex/` directory. Parse `drug-tarot-system.md` to build drug→tarot-suit mapping. Extract archetype descriptions for templates.

**Acceptance Criteria:**
- `codex/` directory with `archetypes.md`, `drug-tarot-system.md`, `philosophy.md`
- `build/lore.js` exports `DRUG_SUITS` mapping (drug name → suit: wands/cups/swords/pentacles)
- All 78 drugs mapped; unmatched drugs from CSV logged as warnings
- Archetype descriptions extracted for use in explanation templates

**Effort:** Small

---

### Task 1.3: Matching Algorithm

**Description:** Implement the weighted scoring function from SDD section 6. Score every Mibera against all others, pick the top match for each.

**Acceptance Criteria:**
- `build/matching.js` exports `findBestMatch(mibera, allMiberas)` function
- Zodiac compatibility matrix (12×12) implemented per SDD 6.2
- Element pairing scores per SDD 6.3
- Archetype contrast scoring per SDD 6.4
- Moon/ascending sign compatibility per SDD 6.5
- Drug-tarot suit complementarity per SDD 6.6
- Chaos flag set when Fire+Water or Earth+Air elements paired
- Weighted total: sun(30%) + element(20%) + archetype(20%) + moonAsc(15%) + drugTarot(10%) + chaos(5%)
- Each Mibera gets exactly one best match (highest score)
- No self-matches
- Build completes in < 60 seconds

**Effort:** Medium

---

### Task 1.4: Explanation Template System

**Description:** Implement the template-based explanation generator that produces 3–5 sentence match descriptions.

**Acceptance Criteria:**
- `build/templates.js` exports `generateExplanation(mibera1, mibera2, matchResult)` function
- 15+ opener variants, 10+ closer variants
- Archetype-specific lines for each of the 16 archetype pairings (4×4)
- Zodiac-specific lines referencing sign names
- Element connection lines for all 7 element pairings
- Chaos lines included when `chaos === true`
- Each explanation is 3–5 sentences, 50–80 words
- No two adjacent Miberas (e.g., #1 and #2) get identical text

**Effort:** Medium

---

### Task 1.5: JSON Generation & Build Integration

**Description:** Wire everything together in `build.js`. Generate `data/miberas.json` and `data/matches.json`. Print build summary.

**Acceptance Criteria:**
- `npm run build` executes the full pipeline end-to-end
- `data/miberas.json` contains all 10,000 entries keyed by token ID
- `data/matches.json` contains all 10,000 match results keyed by token ID
- Build prints: time elapsed, file sizes, chaos match count, sample match
- Both JSON files are valid (parseable by `JSON.parse`)
- `data/` directory created automatically if missing

**Effort:** Small

---

## Sprint 2: Frontend UI

**Goal:** Build the single-page static site with dark rave + Valentine aesthetic. Wire up search, display match results with images and traits.

### Task 2.1: HTML Structure & Search Input

**Description:** Create `index.html` with the landing state: title, search input, and hidden results container.

**Acceptance Criteria:**
- `index.html` with semantic HTML structure per SDD 8.1
- Search form with number input (min=1, max=10000) and submit button
- Results container (`#results`) hidden by default
- Error container (`#error`) hidden by default
- Meta tags for viewport (responsive), charset, title

**Effort:** Small

---

### Task 2.2: CSS Styling — Dark Rave + Valentine Theme

**Description:** Create `style.css` with the dark rave aesthetic, neon accents, and Valentine motifs.

**Acceptance Criteria:**
- CSS custom properties for all design tokens (SDD 8.2)
- Dark background (#0a0a0a), neon pink/magenta/cyan accents
- Neon glow effect on "It's a Match!" text
- Mibera card styling with dark card background (#1a1a2e)
- Pulsing heart animation (CSS keyframes)
- Search input styled to match theme
- Responsive: side-by-side cards > 768px, stacked ≤ 768px
- Clean typography for trait readability

**Effort:** Medium

---

### Task 2.3: JavaScript — Data Loading & Match Display

**Description:** Create `app.js` with lazy data loading, search handling, and match rendering.

**Acceptance Criteria:**
- `app.js` with no external dependencies
- Lazy-loads `miberas.json` and `matches.json` on first search (parallel fetch)
- Data cached in memory after first load
- `handleSearch()` validates input (1–10,000), fetches match, renders result
- `renderMatch()` populates both Mibera cards (image, name, traits) and explanation
- Images use `loading="lazy"` attribute
- Image error fallback: colored placeholder with Mibera name
- Error messages for invalid input and data load failures
- All trait values displayed via `textContent` (no `innerHTML` with raw data)

**Effort:** Medium

---

### Task 2.4: Polish & Mobile Testing

**Description:** Final polish pass — animations, transitions, mobile layout verification, edge cases.

**Acceptance Criteria:**
- Smooth reveal animation when match is displayed
- Search input clears/resets properly between lookups
- Mobile layout works on 375px width (iPhone SE) and up
- Token IDs 1, 5000, and 10000 all work correctly
- "None" trait values handled gracefully (hidden or shown as "—")
- Page title and favicon set
- Tested with local HTTP server (`npx serve` or `python -m http.server`)

**Effort:** Small

---

## Dependencies

```
Sprint 1 ──→ Sprint 2
  (JSON files must exist before frontend can load them)
```

Task dependencies within sprints:
- **1.1** and **1.2** can run in parallel
- **1.3** depends on **1.1** + **1.2** (needs parsed data + lore)
- **1.4** depends on **1.2** (needs archetype descriptions)
- **1.5** depends on **1.3** + **1.4** (wires everything together)
- **2.1**, **2.2** can run in parallel
- **2.3** depends on **2.1** (needs HTML structure to bind to)
- **2.4** depends on all of **2.1–2.3**

## Risks

| Risk | Sprint | Mitigation |
|------|--------|-----------|
| Build too slow (100M comparisons) | 1 | Profile. If > 60s, pre-filter by element group. |
| Drug names don't match between CSV and codex | 1 | Normalize + fuzzy match. Log warnings for manual review. |
| JSON too large for mobile | 2 | Gzip on server. If still too large, split by ID range. |
| Irys images slow | 2 | Show traits immediately, lazy-load images. |
