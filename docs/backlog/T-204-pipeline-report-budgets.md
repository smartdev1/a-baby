---
id: T-204
title: Coverage report v2: tiles, instances, facades, roofs and budgets of every tile
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P2
size: S
---

## Context

The 18-report stage reports OSM coverage only. J2 asks to check budgets on all tiles and to follow the generated content.

Jalon : **J2** (`docs/roadmap.md`, J2-14).

## User story

As the team, I want one report of the generated world so that regressions in size, triangles, draw calls or content are visible at each build.

## Acceptance criteria
- [x] Given a build, Then `coverage-report.md/json` add: L0/L1(/L2/L3) tile counts, size and triangles (mean, p95, max) per level, draw calls (mean, max), instances by module family, facades by profile, sheet roofs, named places.
- [x] Given a tile over 80 % of a budget maximum, Then it is listed as a warning.

## Out of scope

- Charts (the report stays Markdown + JSON).

## Technical notes

Reads the encode and lod indexes and the stage reports; no re-encoding.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `src/world-stats/` (statistics + Markdown); `18-report` v5 writes `world-report.json/md`; `16-encode` v10 keeps `drawCalls` and `instanceCount` per tile in `encode-index.json`.
- Yopougon: L0 4 481 tiles, 241 MB, size 55 / 177 / 302 KB (mean / p95 / max), triangles ≤ 10 869, draw calls 8 / 22 / 26, instances ≤ 9 038; L1 1 213, L2 344, L3 102; **no tile above 80 % of a budget maximum**. Content: 3.41 M facade, 410 k vegetation and 39 k prop instances, 28 957 sheet roofs, 17 925 places.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
