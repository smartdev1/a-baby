# `tools/map-pipeline/src/lod/`

- **Owner:** backend developer
- **Status:** Active — T-105 (L1); L2/L3 impostors in J2

## Role

Coarser render-only levels for distant Yopougon.

| File | Role |
|---|---|
| `build-l1-tile.ts` | L1 (500 m) from its 4 L0 children: buildings < 30 m² dropped, footprints simplified (1.5 m), paths dropped, terrain on a 10 m grid, water cell = ≥ 2 of its 4 child cells |
| `simplify-ring.ts` | Douglas–Peucker on closed rings, ring area |

L1 tiles have no collision, meta or instances (render only).
