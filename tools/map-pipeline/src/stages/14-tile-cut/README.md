# `tools/map-pipeline/src/stages/14-tile-cut/`

- **Owner:** backend developer
- **Status:** Active — T-012

## Role

`buildings.ndjson` + `classified.ndjson` + place names + terrain + `props.ndjson` (12) + `facades.ndjson` / `roofs.ndjson` (11) → `tiles.ndjson` (one L0 tile per line). Logic in `src/tiling/`.
