# Project Notes

## Learnings

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-01 | Cache: result stored [key: 65354904...] | Source: cache |
| 2026-02-22 | Cache: result stored [key: 65354904...] | Source: cache |
| 2026-02-14 | Cache: result stored [key: 65354904...] | Source: cache |
| 2026-02-13 | Cache: result stored [key: 669ffadc...] | Source: cache |
## Critical Finding (2026-03-01)
- **No Tarot column in CSV** — tarot is DERIVED from `drug` field. Each drug = one tarot card per Drug-Tarot System. Effect-rules.json must key on DRUG for tarot effects, not a separate trait.
- **Drug count**: ~79 confirmed (some variant naming). CSV uses lowercase slugs (e.g., "st. john's wort").
- **Archetype values in CSV**: `chicago/detroit` (with slash) not "Chicago Detroit"

## Known Risks (from fullstack archetype)
- XSS through unsanitized user content (NFT # input)
- Canvas/WebGL performance on mobile — effects engine may be heavy
- External data dependency (GitHub raw URLs) — latency / availability
- No auth in v1 — any NFT # is accessible; rate-limiting may be needed
- Large metadata CSV (10k rows) — parse/load strategy needed

## Sprint 1 Implementation Notes (2026-03-01)

- `data/codex-drugs.json` created — 77 drugs, all CSV-confirmed slugs, all fields complete, all ≥2 base_effects
- `data/effect-rules.json` created — 33 ancestors, 4 archetypes, 4 elements, tarot suit modifiers, dose modifiers, thought bubble pool
- `experience.html` / `experience.css` / `experience.js` created — standalone page (does not touch index.html/app.js)
- Tarot derivation in effect-rules.json: No drug_tarot section. Instead: drug slug → codex-drugs.json[slug].connections → suit → effect-rules.json.tarot_suits[suit]
- CSP in vercel.json allows irys.xyz for images, blocks inline scripts
- Drug count 77 vs target 79 — 2 slugs have variant naming in CSV (Sprint 3 TASK-3.3 quality pass will catch)

## Sprint 3 Implementation Notes (2026-03-01)

- 8 new effects implemented: thoughtSpiral, shadowFigures, pixelWarp, mandala, tunnelVortex, eyeDilation, glitchBars, chillFume — KNOWN_EFFECTS now 16
- MEDIUM-002 fixed: `_boundTick` cached in constructor, no per-frame `.bind()` allocation
- MEDIUM-003 fixed: 5-frame rolling dt average with upward effect recovery + 30-frame cooldown
- a2a/sprint-5 was occupied by cycle-026 GoogleAdapter — used a2a/sprint-81 for Mibera sprint-3
- CSP hardened: removed `'unsafe-inline'` from style-src; added HSTS
- Deep link: `?t=TOKEN&d=DRUG_SLUG&dose=DOSE` auto-triggers experience
- Copy Link button uses `navigator.clipboard` + `execCommand` fallback
- fuck_me_up extra_effects now includes glitchBars, tunnelVortex, pixelWarp
- Fallback for dissociative/depressant: tunnelVortex+breathingWarp (not amberVignette — CA-2 fix)

## Blockers

## Observations
