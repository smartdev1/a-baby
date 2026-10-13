# `tools/map-pipeline/src/stages/16-encode/`

- **Owner:** backend developer
- **Status:** Active — T-012

## Role

`tiles.ndjson` → `tiles/L0/{i}_{j}/{geom,collision,meta,instances}.<hash>.<ext>` + `encode-index.json` (hashes, bytes, triangles per tile). Draw calls = material groups + instanced modules. Fails, naming the tiles, when one is over budget. The cache also checks that every indexed file still exists.

Yopougon (snapshot 2026-10-01): 2 901 tiles, 38.7 MB, 13.7 KB average, 119 KB max, ≤ 4 501 triangles per tile, 11 s.
