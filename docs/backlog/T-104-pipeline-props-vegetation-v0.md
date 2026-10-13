---
id: T-104
title: Pipeline stage `props-vegetation` v0: seeded street furniture and trees
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Streets need life: street lights, kiosks, trees. The legacy PropPlacer placed props randomly in a 300-unit world.

Jalon : **J1** (`docs/roadmap.md`, J1-05). Dépend de : T-101. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As a player, I want streets with lamps, kiosks and trees so that walking around is pleasant.

## Acceptance criteria

- [ ] Given the road graph, Then props are placed along edges at densities in metres, perpendicular to the road, never on the carriageway, seeded by edge id.
- [ ] Given OSM `natural=tree` / `landuse` / parks, Then vegetation instances are placed inside them with a density per land cover.
- [ ] Given the output, Then props and trees are written as instances (same codec as T-102) and counted in the report.

## Out of scope

- Animated props, interiors.

## Technical notes

ARCHITECTURE §11.2 (12).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
