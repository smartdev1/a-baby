---
id: T-111
title: Pipeline stage `naming` v0: real toponyms, parodied brands and shops
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context
Tile places have `displayName: null`. Owner decision: real street and public place names, parodied brands and shops (e.g. Orange → Oronge).

Jalon : **J1** (`docs/roadmap.md`, ADR 0010 (J2 pulled forward)). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want to see place names that feel like Yopougon without real brands so that the city is recognizable and legally safe.

## Acceptance criteria
- [x] Given `content/place-names/brand-parodies.json` (human-reviewed table), Then known brands get their parody; an unknown brand tag (`brand=*`) fails the build until it is added.
- [x] Given other shops, Then names are deformed deterministically (seed = OSM id, minimum edit distance) and public places / streets keep their real names.
- [x] Given `content/place-names/overrides/<osmId>.json`, Then renames and removals on request are applied.
- [x] Given `meta.json`, Then `displayName` is filled only by this stage and escaped as text.

## Out of scope
- Shop signs rendering (frontend).

## Technical notes
ADR 0010, ARCHITECTURE §3.4. The brand table needs the owner's review.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — Stage `09-naming` + `src/naming/` + `content/place-names/`:
  - Decision order: override > hidden (offensive words, prefix match) > real name for public places (worship, education, public, sport, stops/stations/taxi ranks/parkings, markets, parks, hospitals) > brand parody (brand tag or name words, accent/case-insensitive, longest match first) > deformed proper nouns (2 seeded letter swaps per word, generic words kept) > generic name kept.
  - `brand-parodies.json` covers every `brand=*` value found in Yopougon (≈ 75 brands: telecoms, fuel, banks, retail, fast food…); **unknown brands fail the build**. `reviewedBy` is null: **owner review needed**.
  - Names sanitised (no control characters, ≤ 120 chars); tiles' `meta.json` now carry `displayName` (tile-cut v2, encode v3); golden covers `place-names.ndjson`.
  - False positive found on real data: "Carrefour" is also the common word for crossroad (bus stop "Carrefour Koweit") → only "Carrefour Market" is parodied.
- Yopougon: 3 383 toponyms, 843 brand parodies, 4 302 deformed, 4 448 generic kept, 4 949 unnamed; 1.2 s. Tests: 7.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
