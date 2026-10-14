# `tools/map-pipeline/src/stages/13-places-sites/`

- **Owner:** backend developer
- **Status:** Active — T-305

## Role

Classified places (05) + buildings (06) + car roads (08) + `content/place-types/*.place.json` → `places-sites.ndjson` (OSM place id, place type, sites in UTM) + `places-report.json` (places per type, categories without type). Stage 14 writes `placeType` and `sites` (tile-local) into each tile's `meta.json` (`TilePlaceSchema`). Logic in `src/places/`.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
