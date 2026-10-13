# `tools/map-pipeline/src/meshing/`

- **Owner:** backend developer
- **Status:** Active — T-012 (flat placeholder look; modular facade kits in J1)

## Role

Offline triangulation of a tile (the client never triangulates).

| File                  | Role                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `mesh-buffer.ts`      | Triangle accumulator per material; engine frame (x east, y up, z north) → glTF (z = −north)                                     |
| `extrude-building.ts` | Flat roof by earcut (holes supported) + outward walls; no artificial wall on tile borders. Real footprint, never a bounding box |
| `road-ribbon.ts`      | Road and path ribbons at the real width of their `highway` class (`src/roads/road-classes.ts`); ground quad                     |

## Rules

- Babylon's glTF loader flips z back: once loaded, x = east, z = north, 1 unit = 1 m.
