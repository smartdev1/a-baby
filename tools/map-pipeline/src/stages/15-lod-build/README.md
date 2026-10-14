# `tools/map-pipeline/src/stages/15-lod-build/`

- **Owner:** backend developer
- **Status:** Active — T-105, T-202

## Role

`tiles.ndjson` → render-only tiles L1 (500 m), L2 (1 km) and L3 (2 km) `tiles/L{n}/{i}_{j}/geom.<hash>.glb` + `lod-index.json`. Each level streams the L0 lines by bands of rows (2ⁿ rows) and encodes on the worker pool (`src/parallel/`). Logic in `src/lod/`.

Yopougon: 1 213 L1 (44.7 MB), 344 L2 (16.3 MB), 102 L3 (4.8 MB) tiles, max 236 KB and 25.1 k triangles; 14 s on the worker pool.

A release = `16-encode/tiles` (L0) + `15-lod-build/tiles` (L1–L3) + `17-manifest/world-manifest.<release>.json` (lists every level).
