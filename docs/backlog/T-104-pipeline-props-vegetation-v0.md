---
id: T-104
title: Pipeline stage `props-vegetation` v0: seeded street furniture and trees
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

Streets need life: street lights, kiosks, trees. The legacy PropPlacer placed props randomly in a 300-unit world.

Jalon : **J1** (`docs/roadmap.md`, J1-05). Dépend de : T-101. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As a player, I want streets with lamps, kiosks and trees so that walking around is pleasant.

## Acceptance criteria
- [x] Given the road graph, Then props are placed along edges at densities in metres, perpendicular to the road, never on the carriageway, seeded by edge id.
- [x] Given OSM `natural=tree` / `landuse` / parks, Then vegetation instances are placed inside them with a density per land cover.
- [x] Given the output, Then props and trees are written as instances (same codec as T-102) and counted in the report.

## Out of scope

- Animated props, interiors.

## Technical notes

ARCHITECTURE §11.2 (12).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — `instances.bin` v1 + `INSTANCE_MODULES` catalogue in `@skyline/tile-format` (append-only, shared with the frontend); stage `12-props` + `src/props/`:
  - Street lights by class (30/35/40 m, alternating on main roads, 1.2 m from the kerb), kiosks (+ bin) and bus stops (sign or shelter) at real OSM points facing the nearest road, OSM trees, seeded grids in forests / parks / scrub; never inside a building or on a carriageway (flatbush guards); dropped on water at encode time; y from the terrain.
  - Tiles: `instances.<hash>.bin` written when a tile has instances, listed in the index and the manifest; counted in the size budget.
- Yopougon: 449 635 instances in 2 569 tiles (35 408 lights, ≈ 313 000 trees, 96 517 bushes, 973 kiosks, 1 858 stops); 21 s; world 171 MB.
- Tests: codec (3, incl. fuzz), placement (4), golden covers terrain and props.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
