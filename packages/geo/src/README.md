# `packages/geo/src/`

- **Owner:** backend developer
- **Status:** Active — T-008

## Role

Source code of `@skyline/geo`.

## Contents

| File | Role |
|---|---|
| `index.ts` | Public API (the only entry point) |
| `geo-types.ts` | `LonLat`, `UtmPosition`, `EnginePosition`, `UtmBounds` |
| `utm-zone-30n.ts` | WGS84 / UTM 30N constants and Krüger coefficients |
| `utm-projection.ts` | `toUtm30n`, `fromUtm30n` |
| `world-grid.ts` | Fixed grid origin, extent, tile sizes per level, grid bounds checks |
| `tile-keys.ts` | Tile keys: compute, parse, bounds, parent/children |
| `cell-keys.ts` | Server cell keys and their tiles |
| `engine-frame.ts` | UTM ↔ engine frame (floating origin) |

Unit tests live next to the code (`*.test.ts`): PROJ reference points, fast-check properties (round trip, containment, cell/tile alignment).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
