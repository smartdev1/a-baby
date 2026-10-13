# `tools/map-pipeline/src/stages/03-export/`

- **Owner:** backend developer
- **Status:** Active — T-022

## Role

Produces `features.geojsonseq` (one GeoJSON feature per line), the common input of every later stage, whatever the source.

| File | Role |
|---|---|
| `export-stage.ts` | `osm-snapshot` → `osmium export -f geojsonseq` with `@type`/`@id`; `local-file` → conversion of the fixture |
| `geojson-to-seq.ts` | FeatureCollection → GeoJSONSeq |

Yopougon (snapshot 2026-10-01, provisional bbox): ≈ 297 500 features, ≈ 79 MB.
