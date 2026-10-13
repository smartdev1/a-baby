---
id: T-101
title: Pipeline stage `roads`: road and pedestrian graph with flatbush, oneway, widths, sidewalks
status: todo
owner: backend
author_of_code:
priority: P0
size: L
---

## Context
The tiles draw roads as ribbons but there is no graph: the zone server, NPCs and transport (J4) need a navigable network. The legacy `RoadNetwork` was O(n²) and is gone (T-015).

Jalon : **J1** (`docs/roadmap.md`, J1-02). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As the simulation, I want a road and footpath graph of Yopougon so that characters and vehicles can find their way.

## Acceptance criteria
- [ ] Given `classified.ndjson`, When `roads` runs, Then it outputs a graph (nodes at intersections, edges with class, length, width, `oneway`, surface) built with a `flatbush` index in O(n log n) — whole Yopougon in < 30 s.
- [ ] Given two ways crossing without a shared node (bridge, tunnel, `layer`), Then they are not connected.
- [ ] Given a residential street, Then a sidewalk edge pair is generated for pedestrians when no `footway` runs along it.
- [ ] Given the graph, Then it is cut per L0 tile (`nav` data reference in `meta`) and the golden test covers it.
- [ ] Given the report stage, Then the number of connected components and the largest one's share are reported.

## Out of scope
- Lanes, traffic lights, turn restrictions (J4).

## Technical notes
ARCHITECTURE §11.2 (08), §17. Graph search (A*) lives in `sim-transport` (J4).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
