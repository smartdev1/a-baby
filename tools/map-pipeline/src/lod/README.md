# `tools/map-pipeline/src/lod/`

- **Owner:** backend developer
- **Status:** Active — T-105 (L1); L2/L3 impostors in J2

## Role

Coarser render-only levels for distant Yopougon.

| File | Role |
|---|---|
| `build-l1-tile.ts` | L1 (500 m) from its 4 L0 children: buildings < 30 m² dropped, footprints simplified (1.5 m), paths dropped, terrain on a 10 m grid, water cell = ≥ 2 of its 4 child cells |
| `simplify-ring.ts` | Douglas–Peucker on closed rings, ring area |
| `build-coarse-tile.ts` | L2 (1 km) and L3 (2 km) from their 16 / 64 L0 descendants: terrain on a 51 × 51 grid (20 m / 40 m), water sampled at cell centres, major roads only (L2 down to tertiary, L3 down to secondary), buildings replaced by block impostors |
| `block-impostors.ts` | Footprints sampled 4 × 4 per grid cell (20 m on L2, 40 m on L3); a cell ≥ 18 % built becomes one box, side √share × cell, top = mean roof height, sunk 1 m into the coarse ground |

L1–L3 tiles have no collision, meta or instances (render only). Yopougon: 1 213 L1 (44.7 MB), 344 L2 (16.3 MB), 102 L3 (4.8 MB), all within §10.4.
