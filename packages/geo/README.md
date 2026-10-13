# `packages/geo/`

- **Owner:** backend developer (contract shared with frontend: changes are reviewed by the frontend developer)
- **Status:** Active — T-008

## Role

Single source of truth for geography in SkyLine: WGS84 ↔ UTM zone 30N (EPSG:32630) projection, the fixed world grid of the Abidjan District, tile keys, server cell keys and the engine frame. Pure package (no DOM, no Node API, no runtime dependency).

## How it works

- **Projection**: Krüger series (order n³) on the WGS84 ellipsoid, checked against PROJ 9.8.1 to the centimetre; round-trip error < 1 cm on 10 000 random District points.
- **World grid** (`world-grid.ts`): constant origin `E 300 000 / N 540 000` (south-west of the District, rounded to the km), extent 160 km × 120 km. **Never change the origin**: every tile and cell id depends on it.
- **Tiles** (`tile-keys.ts`): `L{level}_{i}_{j}`, `i` eastward, `j` northward. Sizes: L0 250 m, L1 500 m, L2 1 km, L3 2 km. Bounds are min-inclusive / max-exclusive.
- **Cells** (`cell-keys.ts`): `C_{i}_{j}`, 4 × 4 L0 tiles = 1 km², always aligned on tiles.
- **Engine frame** (`engine-frame.ts`): x = east, y = up, z = north, metres relative to a floating origin. This is the only conversion to engine coordinates.

```ts
import { toUtm30n, tileKeyOf, cellKeyOf, toEngine } from '@skyline/geo';

const utm = toUtm30n({ lonDeg: -4.0717, latDeg: 5.3364 }); // E 381 253.2, N 589 952.93
tileKeyOf(utm, 0); // 'L0_325_199'
cellKeyOf(utm); // 'C_81_49'
```

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- Other packages import only from `@skyline/geo` (no deep imports).
- See `ARCHITECTURE.md` §10.1–10.2 and ADR 0002.
