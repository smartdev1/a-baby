# `tools/map-pipeline/src/stages/04-normalize/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

`features.geojsonseq` → `normalized.ndjson`: stable OSM ids, coordinates in UTM 30N metres (cm), areas as MultiPolygon, trimmed tags, parsed `levels` / `heightM`. Features without id or with unsupported geometry are dropped (counted in the log).

No coordinate is normalized or scaled: positions are real metres (fixes the prototype 0.25 scale bug).
