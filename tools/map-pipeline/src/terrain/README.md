# `tools/map-pipeline/src/terrain/`

- **Owner:** backend developer
- **Status:** Active — T-103

## Role

Relief and water of the commune, per L0 tile.

| File | Role |
|---|---|
| `height-grid.ts` | Regular UTM height grid (5 m cells, row 0 = south), bilinear sampling |
| `envi-raster.ts` | Reads the Float32 ENVI raster written by `gdalwarp` (DEM reprojected to UTM 30N, 5 m) |
| `ground-filter.ts` | Copernicus GLO-30 is a **surface** model (roofs, tree tops): min filter (radius 4 cells) + mean filter (radius 3) → plausible bare ground |
| `road-levelling.ts` | Flattens the ground across carriageways (half width + 1 m), bridges/tunnels ignored |
| `water-classifier.ts` | Water = right side of the nearest OSM coastline segment (OSM convention, flatbush kNN) or inside `natural=water` / riverbank / reservoir polygons |
| `tile-terrain.ts` | Per tile: 51 × 51 heights (shared edges), 50 × 50 water mask + level, lagoon bed 1.5 m under the water |
| `terrain-sampler.ts` | Ground height anywhere (seats buildings on their lowest footprint vertex) |

## Notes

- `osmcoastline` was tried first: on a country extract it cannot close the coastlines cut at the borders (one useless polygon), hence the coastline-side classifier.
- Water edges follow the 5 m grid (stepped shore in v0).
