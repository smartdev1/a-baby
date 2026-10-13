# `tools/map-pipeline/src/stages/08-roads/`

- **Owner:** backend developer
- **Status:** Active — T-101

## Role

`classified.ndjson` → `road-nodes.ndjson`, `road-edges.ndjson` (class, length, width, oneway, cars / pedestrians, sidewalks, layer, UTM geometry), `road-tiles.json` (L0 tile → edge ids) and `road-stats.json` (also shown in the coverage report).

Yopougon (snapshot 2026-10-01, commune + 300 m): 18 162 nodes, 24 385 edges, 2 150 km, 33 components, largest = 84.8 % of the length, sidewalks generated on 18 371 street edges; 1.6 s.

Per-tile `nav.bin` encoding (for NPCs) comes in J3 (ARCHITECTURE §10.3); A* routing lives in `sim-transport` (J4).
