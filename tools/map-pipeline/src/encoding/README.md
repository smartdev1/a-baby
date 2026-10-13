# `tools/map-pipeline/src/encoding/`

- **Owner:** backend developer
- **Status:** Active — T-012

## Role

Encoding a cut tile into its files, through `@skyline/tile-format`.

| File | Role |
|---|---|
| `tile-encoder.ts` | `geom` + `collision` + `meta` of a tile, 16-hex content hashes, triangle and draw-call counts |
| `tile-glb.ts` | glTF binary: one mesh per material (ground, road, path, walls, roofs), `KHR_mesh_quantization` + `EXT_meshopt_compression` |
| `tile-budgets.ts` | ARCHITECTURE §10.4 maxima (1.5 MB, 400 k triangles, 40 draw calls); violations name the tile |

## Notes for the client (frontend)

- `geom.glb` needs Babylon's meshopt decoder (`EXT_meshopt_compression`) — the glTF loader fetches it automatically or it can be bundled.
- Positions are quantized; precision measured on Yopougon: ≤ 1.3 cm.
- `collision.bin` v1 (format v1): relief height field (51 × 51, 5 m), building prisms from the ground (`baseYM`) to the roof, water cells (not walkable).
- Meshes: `ground` (relief grid), `water`, `road`, `path` (draped, densified ≤ 4 m), `walls`, `roofs`.
- Frame: Babylon maps glTF (x, y, z) → (−x, y, z), so the pipeline writes x = −east; loaded tiles have **x = east, z = north** (verified with a real Babylon load).
- `meta.json` places carry their `displayName` from stage 09-naming (ADR 0010).
