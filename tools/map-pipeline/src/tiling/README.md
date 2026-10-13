# `tools/map-pipeline/src/tiling/`

- **Owner:** backend developer
- **Status:** Active — T-012

## Role

Cutting the commune into 250 m L0 tiles.

| File | Role |
|---|---|
| `tile-content.ts` | Content of one tile (`tiles.ndjson` line): building parts, building attributes, road lines, places — local metres from the tile SW corner |
| `tile-frame.ts` | Tiles overlapped by a bbox, tile of a point, UTM → local, neighbours |
| `clip-to-tile.ts` | Polygon clipping (polygon-clipping, only for footprints crossing a border) and polyline clipping (Liang–Barsky) |
| `tile-cutter.ts` | Distributes buildings (geometry in every tile they cover, attributes in the tile of their representative point), roads and places |

## Rules

- Output order is deterministic (tiles sorted by row then column, entries in input order).
