---
id: T-102
title: Pipeline stage `facades-roofs` v0: facade bays, profile grammar, instance lists, flat and sheet-metal roofs
status: todo
owner: backend
author_of_code:
priority: P0
size: L
---

## Context
Buildings are flat extruded volumes. The semi-realistic look (ADR 0005) relies on modular facade kits assembled from instance lists computed offline.

Jalon : **J1** (`docs/roadmap.md`, J1-03). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want believable Yopougon facades (shops on the ground floor, balconies, sheet-metal roofs) so that the commune feels real.

## Acceptance criteria
- [ ] Given a building footprint, its height and type, When `facades-roofs` runs, Then each wall is split into bays (3 m grid, 3.5 m ground floor) and every bay gets a module id from a seeded profile grammar (ground floor shop / door / window, upper floors, parapet).
- [ ] Given the output, Then `instances.bin` (module id, compact matrix, variation tint/dirt) is written per tile with its codec in `@skyline/tile-format`, and `geom.glb` keeps only roofs and blank walls.
- [ ] Given roof types, Then flat concrete roofs and sheet-metal pitched roofs are chosen by type/size/seed.
- [ ] Given the module catalogue, Then it is a versioned list shared with the frontend (`content/` or tile-format), not hard-coded twice.
- [ ] Given the budgets, Then instances per tile and draw calls stay within §10.4.

## Out of scope
- Facade 3D models (frontend, J1-06), interiors.

## Technical notes
ADR 0005, ARCHITECTURE §12.2. Needs the module list agreed with the frontend developer.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
