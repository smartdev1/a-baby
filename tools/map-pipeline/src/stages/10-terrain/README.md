# `tools/map-pipeline/src/stages/10-terrain/`

- **Owner:** backend developer
- **Status:** Active — T-103

## Role

DEM (Copernicus GLO-30 tile pinned in `sources.lock.json`, downloaded once to `data/cache/dem/`) → `gdalwarp` in the frozen Docker image (UTM 30N, 5 m, extent = commune + margin snapped to tiles) → bare-ground filter → road levelling → water → `terrain-tiles.ndjson` (one line per L0 tile) + `terrain-report.json`. The fixture source gets a flat terrain (no download).

Yopougon: 4 081 terrain tiles, 413 with water, heights −3 m (lagoon bed) to 134 m, 743 894 levelled cells; 24 s.
