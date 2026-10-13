---
id: T-101
title: Pipeline stage `roads`: road and pedestrian graph with flatbush, oneway, widths, sidewalks
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context
The tiles draw roads as ribbons but there is no graph: the zone server, NPCs and transport (J4) need a navigable network. The legacy `RoadNetwork` was O(n²) and is gone (T-015).

Jalon : **J1** (`docs/roadmap.md`, J1-02). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As the simulation, I want a road and footpath graph of Yopougon so that characters and vehicles can find their way.

## Acceptance criteria
- [x] Given `classified.ndjson`, When `roads` runs, Then it outputs a graph (nodes at intersections, edges with class, length, width, `oneway`, surface) built with a `flatbush` index in O(n log n) — whole Yopougon in < 30 s.
- [x] Given two ways crossing without a shared node (bridge, tunnel, `layer`), Then they are not connected.
- [x] Given a residential street, Then a sidewalk edge pair is generated for pedestrians when no `footway` runs along it.
- [ ] *(partly)* Given the graph, Then it is cut per L0 tile (`nav` data reference in `meta`) and the golden test covers it.
- [x] Given the report stage, Then the number of connected components and the largest one's share are reported.

## Out of scope
- Lanes, traffic lights, turn restrictions (J4).

## Technical notes
ARCHITECTURE §11.2 (08), §17. Graph search (A*) lives in `sim-transport` (J4).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — Stage `08-roads` + `src/roads/`:
  - Graph from classified ways: shared vertices (same OSM node ⇒ identical coordinates) and way ends are nodes; O(n) hashing, so ways crossing without a shared node (bridges with `layer`, tunnels) stay disconnected. flatbush indexes footway segments for the parallel-sidewalk search (O(n log n)).
  - Edge attributes: class, length, width, `oneway` (incl. roundabouts and motorways, `-1`), cars / pedestrians access, `layer`, sidewalks (tags first, else generated on both sides unless a parallel footway exists within 10 m).
  - `road-classes.ts` is now the single source of widths/access, also used by the tile meshing; residential width set to **6 m** (T-014 contract) → `16-encode` version 2.
  - Outputs: nodes, edges, `road-tiles.json` (L0 tile → edges), `road-stats.json`; the coverage report has a "Road graph" section; golden test covers edges and stats.
- Yopougon: 18 162 nodes, 24 385 edges, 2 150 km (commune + 300 m margin), 33 components, largest 84.8 % of the length, 18 371 street edges with generated sidewalks; **1.6 s** (criterion < 30 s).
- **Remaining:** the per-tile reference in `meta.json` / `nav.bin` is not encoded yet — ARCHITECTURE §10.3 plans `nav.bin` from J3 (needs a tile-format version bump agreed with the frontend). Sidewalks are an edge attribute (geometry to be generated with the facades / ground meshing).

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
