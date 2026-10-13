---
id: T-204
title: Coverage report v2: tiles, instances, facades, roofs and budgets of every tile
status: todo
owner: backend
author_of_code:
priority: P2
size: S
---

## Context

The 18-report stage reports OSM coverage only. J2 asks to check budgets on all tiles and to follow the generated content.

Jalon : **J2** (`docs/roadmap.md`, J2-14).

## User story

As the team, I want one report of the generated world so that regressions in size, triangles, draw calls or content are visible at each build.

## Acceptance criteria
- [ ] Given a build, Then `coverage-report.md/json` add: L0/L1(/L2/L3) tile counts, size and triangles (mean, p95, max) per level, draw calls (mean, max), instances by module family, facades by profile, sheet roofs, named places.
- [ ] Given a tile over 80 % of a budget maximum, Then it is listed as a warning.

## Out of scope

- Charts (the report stays Markdown + JSON).

## Technical notes

Reads the encode and lod indexes and the stage reports; no re-encoding.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
