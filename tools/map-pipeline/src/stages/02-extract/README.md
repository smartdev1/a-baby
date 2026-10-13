# `tools/map-pipeline/src/stages/02-extract/`

- **Owner:** backend developer
- **Status:** Active — T-022 (bbox); relation polygon after spike SP2 (T-018)

## Role

Cuts the commune out of the national snapshot and keeps only game-relevant features.

## How it works

1. Boundary: with `boundary.osmRelationId` (Yopougon `r3377881`), `osmium getid` + `export` → `boundary.geojson`, bbox of the polygon; otherwise `provisionalBboxLonLat` and an empty `boundary.geojson`.
   Then `osmium extract --bbox` with that bbox grown by `marginM` (`complete_ways` strategy).
2. `osmium tags-filter` with `OSM_TAG_FILTERS` (buildings, highways, amenities, shops, land use, water, transport…).
3. Outputs: `commune.osm.pbf` without user metadata (Yopougon ≈ 2.9 MB) and `boundary.geojson`. Deterministic: same snapshot + config ⇒ same sha256.

Needs Docker and the image `skyline/osmium:1.18.0` (`pnpm map:osmium-image`).
