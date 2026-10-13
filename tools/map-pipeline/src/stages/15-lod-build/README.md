# `tools/map-pipeline/src/stages/15-lod-build/`

- **Owner:** backend developer
- **Status:** Active — T-105

## Role

`tiles.ndjson` → `tiles/L1/{i}_{j}/geom.<hash>.glb` + `lod-index.json`. The L0 tiles are streamed two rows at a time (an L1 row is complete once L0 rows 2J and 2J+1 are read), so memory stays bounded. Budgets of §10.4 enforced.

Yopougon: 1 213 L1 tiles, 40 MB, 34 KB average, 137 KB max, ≤ 15 713 triangles; 15 s.

A release = `16-encode/tiles` (L0) + `15-lod-build/tiles` (L1) + `17-manifest/world-manifest.<release>.json` (lists both).
