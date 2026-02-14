# Mibera Valentine Match — Build Overview

**Date:** February 14, 2026 (Valentine's Day)
**Live:** https://mibera-valentine.vercel.app
**Repo:** https://github.com/ghrrison-spec/mibera-valentine-match

---

## What It Does

Enter a Mibera token ID (1–10,000) and instantly see your Mibera matched with their most compatible Valentine. Displays both Miberas side-by-side with traits, compatibility score, and a lore-rich explanation of why they're perfect together.

---

## What We Built

### Data Pipeline (Python, runs once at build time)

- Parsed 10,000 Miberas from CSV (31 trait columns each)
- Mapped 92 drugs to tarot suits from the Mibera Codex lore
- Built a 12×12 zodiac compatibility matrix
- Classified 33 ancestors into heritage groups
- Categorized 74 backgrounds into thematic groups
- Ran 100 million comparisons (10K × 10K) to find each Mibera's best match
- Generated unique lore-rich explanations using templates with ancestor, zodiac, element, drug, time period, and background references
- Output: `miberas.json` (6.6 MB) + `matches.json` (7.2 MB)

### Matching Algorithm (8 weighted factors)

| Factor | Weight |
|--------|--------|
| Sun sign zodiac compatibility | 25% |
| Element pairing | 15% |
| Archetype contrast | 15% |
| Moon + ascending signs | 15% |
| Drug-tarot suit | 10% |
| Ancestor heritage | 10% |
| Chaos bonus (Fire+Water, Earth+Air) | 5% |
| Time period harmony | 5% |

Scores scaled to 90–100 via percentile ranking — 101 unique values, mean 95.0.

### Frontend (pure HTML/CSS/JS, zero dependencies)

- Gothic crimson + Valentine aesthetic
- Static canvas background: cathedral with twin towers, spires, flying buttresses, rose window, lancet windows, cultist pyramids, noise overlay
- Pulsing SVG heart between portraits
- Glow effects on NFT images
- 25 traits displayed per Mibera
- Responsive at 768px and 480px breakpoints
- All data via `textContent` or `escapeHTML()` — no XSS vectors

---

## Files

```
my-project/
├── index.html              # Single page (2 KB)
├── style.css               # Gothic Valentine theme (7 KB)
├── app.js                  # Frontend + canvas background (6 KB)
├── vercel.json             # Skip build, serve static
├── data/
│   ├── miberas.json        # 10K Mibera traits (6.6 MB)
│   ├── matches.json        # 10K match results (7.2 MB)
│   └── mibera_all_traits.csv  # Source data (5.1 MB)
└── build/
    ├── build.py            # Pipeline orchestrator
    ├── matching.py         # Scoring algorithm
    ├── templates.py        # Explanation generator
    └── lore.py             # Codex data (drugs, zodiac, ancestors)
```

---

## Development Workflow

Built using the Loa framework (v1.37.0) — agent-driven development:

```
/plan ━━━━━━━ /build ━━━━━━━ /review ━━━━━━━ /ship ✓
```

- **Sprint 1:** Data Pipeline & Matching Algorithm (5 tasks)
- **Sprint 2:** Frontend UI (4 tasks)
- Both sprints code-reviewed and security-audited
- Deployed to Vercel, cycle archived

---

## Technical Notes

- **No Node.js at runtime** — build pipeline uses Python 3.12 (stdlib only, zero dependencies)
- **Performance** — precomputed scoring lookups reduce 100M string operations to 10K
- **Score distribution** — percentile-rank scaling ensures even 90–100 spread despite raw score clustering
- **Image fallback** — NFT images from gateway.irys.xyz currently 404; fallback shows Mibera name
- **Security** — all DOM rendering via textContent/escapeHTML, no innerHTML with untrusted data
