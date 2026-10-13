# `tools/map-pipeline/src/stages/01-source/`

- **Owner:** backend developer
- **Status:** Active — T-010 (OSM snapshot acquisition added by T-022)

## Role

First stage: brings the configured source data into the build folder.

## How it works

- `local-file` source (golden fixture): copies the GeoJSON as `source.geojson` and writes `source.json` (kind, sha256, ODbL licence and attribution).
- `osm-snapshot` source: not supported yet — fails with an explicit message until T-022 (`acquire` / `extract` with osmium).

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
