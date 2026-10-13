---
id: T-102
title: Pipeline stage `facades-roofs` v0: facade bays, profile grammar, instance lists, flat and sheet-metal roofs
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context
Buildings are flat extruded volumes. The semi-realistic look (ADR 0005) relies on modular facade kits assembled from instance lists computed offline.

Jalon : **J1** (`docs/roadmap.md`, J1-03). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want believable Yopougon facades (shops on the ground floor, balconies, sheet-metal roofs) so that the commune feels real.

## Acceptance criteria
- [x] Given a building footprint, its height and type, When `facades-roofs` runs, Then each wall is split into bays (3 m grid, 3.5 m ground floor) and every bay gets a module id from a seeded profile grammar (ground floor shop / door / window, upper floors, parapet).
- [x] Given the output, Then `instances.bin` (module id, compact matrix, variation tint/dirt) is written per tile with its codec in `@skyline/tile-format`, and `geom.glb` keeps only roofs and blank walls.
- [x] Given roof types, Then flat concrete roofs and sheet-metal pitched roofs are chosen by type/size/seed.
- [x] Given the module catalogue, Then it is a versioned list shared with the frontend (`content/` or tile-format), not hard-coded twice.
- [x] Given the budgets, Then instances per tile and draw calls stay within §10.4.

## Out of scope
- Facade 3D models (frontend, J1-06), interiors.

## Technical notes
ADR 0005, ARCHITECTURE §12.2. Needs the module list agreed with the frontend developer.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — Stage `11-facades-roofs` + `src/facades/`:
  - Profiles (commercial, apartments, courtyard, public, industrial) from type / place category / levels; bays 2.25–4.5 m (nominal 3 m), ground floor 3.5 m, upper floors ≈ 3 m fitted to the height; seeded grammar per profile (street ground floor → shops on commercial buildings, one upper module per column, entrance gate or door on the longest street wall, parapet on flat roofs, water tanks and rebar on flat roofs); tint per building and dirt per bay packed in `variant`.
  - Roofs: flat, or sheet metal (mono / dual pitch over the oriented rectangle, 30 cm overhang, own material) for simple rectangular buildings inside one tile, odds per profile.
  - `@skyline/tile-format`: 13 `bld_*` modules appended to `INSTANCE_MODULES` (shared catalogue, module contract documented in its README); `instances.bin` v2 adds `stretchX` / `stretchY` (v1 still decodes).
  - Encoder: facade instances keep their absolute height; draw calls now count instanced modules; `facades.stripBayWalls` (default false) removes bay-covered walls from `geom.glb` — **kept false until the frontend renders the facade kit (J1-06)**, otherwise the preview shows open buildings. The acceptance criterion "geom keeps only roofs and blank walls" is met when the flag is switched.
  - Versions: tile-cut v5, lod-build v2, encode v9; golden updated (adds facades and roofs outputs).
- Yopougon: 74 702 buildings, 74 120 with facades, 3 410 902 facade instances, 28 957 sheet roofs (39 %), stage 18 s; all 4 481 L0 tiles within budget: 55 KB average, 302 KB max, ≤ 10 869 triangles.
- **Frontend to validate**: module list and sizes (tile-format instances README).

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
