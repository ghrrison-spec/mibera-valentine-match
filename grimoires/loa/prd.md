# PRD: Mibera Valentine Match — Date Matcher Simulator

> **Version:** 1.0
> **Created:** 2026-02-14
> **Status:** Draft

## 1. Problem Statement

The Mibera Maker collection (10,000 generative dNFTs) has rich lore — archetypes, zodiac signs, elements, ancestors, a drug-tarot system — but no interactive way for holders to explore character relationships. With Valentine's Day as the occasion, there's an opportunity to create a fun, shareable tool that pairs Miberas as romantic matches based on their traits and lore compatibility.

## 2. Product Vision

A single-page static website where users enter a Mibera token ID and instantly see their Mibera matched with their most compatible "Valentine date" from the collection. Both Miberas are displayed side by side with their images, traits, and a pre-computed explanation of why they're a perfect match.

## 3. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Engagement | Users look up their Mibera and share results |
| Lore discovery | Match explanations reference archetypes, zodiac, elements, drug-tarot |
| Simplicity | Single page, instant results, no loading spinners |
| Shareability | Results are visually appealing enough to screenshot and share |

## 4. User Flow

1. User lands on the page → sees a search input and Mibera branding
2. User enters a token ID (1–10,000)
3. Site instantly displays:
   - **Left:** The entered Mibera (image + traits)
   - **Right:** The matched Mibera (image + traits)
   - **Center/Below:** "It's a Match!" header
   - **Below:** Short paragraph explaining why they're a perfect match
4. User can enter another ID to try again

## 5. Matching Algorithm

The matching system uses a **weighted scoring** approach combining opposites-attract logic with real zodiac compatibility:

### 5.1 Compatibility Factors

| Factor | Weight | Logic |
|--------|--------|-------|
| **Sun Sign Compatibility** | 30% | Real zodiac compatibility (e.g., Fire+Air = good, same element = good) |
| **Element Pairing** | 20% | Complementary elements: Fire↔Air, Water↔Earth attract |
| **Archetype Contrast** | 20% | Different archetypes score higher (opposites attract) |
| **Moon/Ascending Sign** | 15% | Secondary zodiac compatibility check |
| **Drug-Tarot Suit** | 10% | Complementary tarot suits (Wands↔Cups, Swords↔Pentacles) |
| **Chaos Factor** | 5% | Random element — when two Miberas have wildly incompatible traits that somehow work, highlight the chaos |

### 5.2 Zodiac Compatibility Matrix

Based on traditional astrology:
- **High compatibility:** Fire+Fire, Fire+Air, Earth+Earth, Earth+Water, Air+Air, Water+Water
- **Moderate:** Fire+Earth, Air+Water
- **Chaotic/Opposites:** Fire+Water, Earth+Air — still matchable, flagged as "chaotic energy"

### 5.3 Chaos Mentions

When a match scores high despite having conflicting traits (e.g., Fire+Water elements, opposing archetypes), the explanation should acknowledge the chaos:
- "Against all cosmic odds..."
- "The universe threw the rulebook out..."
- "Chaos brought them together..."

### 5.4 Pre-computation

All 10,000 best matches are computed at build time:
- For each Mibera, score all 9,999 others
- Store the top match (token ID + match score + explanation)
- Output as a JSON lookup table bundled with the site

## 6. Data Sources

| Source | Content | Format |
|--------|---------|--------|
| `mibera_all_traits.csv` | Token ID, name, image URL, 30 trait columns | CSV, 10,001 lines |
| `mibera-codex` (GitHub) | Lore: archetypes, elements, zodiac rules, drug-tarot system, ancestors | Markdown files |

### 6.1 Key Trait Columns (from CSV)

- `token_id`, `name`, `image` (Irys gateway URL)
- `archetype` (freetekno, milady, chicago/detroit, acidhouse)
- `sun_sign`, `moon_sign`, `ascending_sign`
- `element` (earth, water, fire, air)
- `drug` (maps to tarot suit via codex)
- `ancestor`, `background`, `time_period`
- `swag_rank`, `swag_score`
- Visual traits: body, hair, eyes, eyebrows, mouth, shirt, hat, glasses, mask, earrings, face accessory, tattoo, item, grail

### 6.2 Codex Lore (from GitHub repo)

- `core-lore/archetypes.md` — Four archetype definitions and seasonal associations
- `core-lore/drug-tarot-system.md` — 78 drugs mapped to tarot cards, elemental suits
- `core-lore/philosophy.md` — Thematic context for match explanations
- `traits/` — Visual trait definitions (1,337+ unique traits)

## 7. Match Explanation Generation

Pre-computed template-based explanations that feel personal:

### 7.1 Template Structure

```
[Opening hook based on compatibility type]
[Archetype contrast or harmony sentence]
[Zodiac compatibility detail]
[Element/drug-tarot connection]
[Chaos mention if applicable]
[Closing romantic flourish]
```

### 7.2 Example Output

> "Mibera #42 (Freetekno, Leo, Fire) meets Mibera #7891 (Milady, Aquarius, Air).
> Where free-spirited rave energy meets digital elegance — Fire feeds Air and the flames grow brighter.
> Leo and Aquarius sit across the zodiac wheel, drawn together by cosmic magnetism.
> Their shared love of St. John's Wort (Wands) keeps the spark alive.
> A match written in the stars — and the bassline."

## 8. Technical Requirements

### 8.1 Stack

- **Pure HTML/CSS/JS** — no framework, no build tools beyond data pre-processing
- **Static site** — all data bundled as JSON, no server needed
- **Single page** — one `index.html` file + assets

### 8.2 Performance

- Page load: < 2 seconds on 3G
- Match lookup: Instant (JSON key lookup, no computation at runtime)
- Images: Lazy-loaded from Irys gateway

### 8.3 Data Pipeline (Build Time)

1. Parse `mibera_all_traits.csv` → structured data
2. Parse codex lore files → compatibility rules
3. Run matching algorithm for all 10,000 Miberas
4. Generate match explanations from templates
5. Output: `matches.json` (token_id → { match_id, score, explanation })
6. Output: `miberas.json` (token_id → { name, image, traits })

### 8.4 Bundle Size Estimate

- `miberas.json`: ~3–5 MB (10,000 entries with traits, minified)
- `matches.json`: ~1–2 MB (10,000 entries with explanations)
- Total JS/CSS/HTML: < 50 KB
- **Strategy:** Lazy-load data JSON on first search, cache in memory

## 9. Design

### 9.1 Aesthetic

**Dark rave base + Valentine accents** — neon hearts, rave-meets-romance:
- Dark background (#0a0a0a or similar)
- Neon accent colors (pink, magenta, cyan)
- Heart motifs with glowing/neon effects
- Clean typography for trait readability
- Mibera neochibi aesthetic respected

### 9.2 Layout

```
┌─────────────────────────────────────────┐
│           MIBERA VALENTINE MATCH        │
│         [Enter Mibera # ______] [Go]    │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐   💜✨   ┌──────────┐    │
│  │  Image 1  │  IT'S A │  Image 2  │    │
│  │           │  MATCH!  │           │    │
│  └──────────┘          └──────────┘    │
│  Mibera #42            Mibera #7891    │
│  Freetekno             Milady          │
│  Leo ☀️ | Fire 🔥     Aquarius ☀️ | Air 💨 │
│  ... traits ...        ... traits ...   │
│                                         │
│  ─── Why They're Perfect Together ───   │
│  "Where free-spirited rave energy..."   │
│                                         │
└─────────────────────────────────────────┘
```

## 10. Scope

### In Scope (MVP)
- Single input field for token ID (1–10,000)
- Instant match display with both images and traits
- Pre-computed match explanations
- Dark rave + Valentine design
- Mobile responsive

### Out of Scope
- Wallet connection
- On-chain verification
- Multiple match suggestions (just the top 1)
- Social sharing buttons (users can screenshot)
- Search by trait name
- Leaderboard or most-matched Miberas

## 11. Risks

| Risk | Mitigation |
|------|------------|
| JSON bundle too large for mobile | Lazy-load, gzip, consider splitting |
| Irys gateway images slow/unavailable | Show trait data immediately, lazy-load images |
| Match explanations feel repetitive | Enough template variety (15+ openers, 10+ closers) |
| Zodiac compatibility oversimplified | Reference real astrological compatibility, not just element matching |
| Codex lore files change upstream | Pin to specific commit or copy relevant data at build time |
