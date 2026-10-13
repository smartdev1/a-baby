# `tools/map-pipeline/src/meshing/`

- **Owner:** backend developer
- **Status:** Active — T-012 (flat placeholder look; modular facade kits in J1)

## Role

Offline triangulation of a tile (the client never triangulates).

| File | Role |
|---|---|
| `mesh-buffer.ts` | Triangle accumulator per material; engine frame (x east, y up, z north) → glTF (x = −east, z = north) |
| `extrude-building.ts` | Flat roof by earcut (holes supported) + outward walls; no artificial wall on tile borders. Real footprint, never a bounding box |
| `terrain-mesh.ts` | Ground grid from the tile heights (smooth normals) and water quads (row runs) |
| `road-ribbon.ts` | Road and path ribbons at the real width of their `highway` class (`src/roads/road-classes.ts`); ground quad |

## Rules

- Babylon's glTF loader maps glTF (x, y, z) → (−x, y, z) (verified with a real Babylon load), so the pipeline writes x = −east: once loaded, **x = east, z = north**, 1 unit = 1 m, origin = tile south-west corner.
