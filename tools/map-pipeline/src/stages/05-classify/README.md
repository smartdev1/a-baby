# `tools/map-pipeline/src/stages/05-classify/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

`normalized.ndjson` → `classified.ndjson`: adds `isBuilding`, `placeCategory` (see `src/taxonomy/`) and `roadClass`. Areal POIs (a school drawn as a polygon) are places too.

Yopougon: 17 925 places (2 110 stops, 1 016 maquis, 958 restaurants, 699 beauty salons, 568 Mobile Money points…).
