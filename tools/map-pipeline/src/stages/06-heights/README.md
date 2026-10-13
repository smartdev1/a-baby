# `tools/map-pipeline/src/stages/06-heights/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

`classified.ndjson` → `buildings.ndjson`: one record per building with type, levels, `heightM`, `heightSource` (`osm` | `heuristic`), footprint (UTM MultiPolygon), footprint area and place category. Rules in `src/heuristics/`.
