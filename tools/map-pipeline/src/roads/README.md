# `tools/map-pipeline/src/roads/`

- **Owner:** backend developer
- **Status:** Active — T-101

## Role

Road and pedestrian network of the commune.

| File                  | Role                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `road-classes.ts`     | **Single source** of `highway` classes: width (residential 6 m…), cars / pedestrians access, path surface, default sidewalks — also used by the tile meshing                                                       |
| `road-way-tags.ts`    | `oneway` (incl. roundabouts, motorways), `layer`, mapped `sidewalk` tags                                                                                                                                           |
| `build-road-graph.ts` | Graph: vertices shared by several ways (same OSM node ⇒ same coordinates) and way ends become nodes; ways split into edges. O(n) hashing; ways crossing without a shared node (bridges, tunnels) stay disconnected |
| `sidewalks.ts`        | Sidewalks: tags first; otherwise generated on both sides of streets unless a footway runs parallel within 10 m (flatbush index)                                                                                    |
| `graph-components.ts` | Connected components (union-find), share of length in the largest one                                                                                                                                              |
| `road-graph-types.ts` | `RoadNode`, `RoadEdge`, `RoadGraphStats`                                                                                                                                                                           |
