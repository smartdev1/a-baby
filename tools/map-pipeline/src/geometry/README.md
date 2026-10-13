# `tools/map-pipeline/src/geometry/`

- **Owner:** backend developer
- **Status:** Active — first helper in T-022; triangulation, spatial index and clipping in T-011/T-012

## Role

Offline geometry helpers of the pipeline.

| File | Role |
|---|---|
| `expand-bbox.ts` | Grows a WGS84 bbox by a margin in metres (rounded to 1e-6° for stable commands) |
| `utm-polygon-area.ts` | Area of a UTM (Multi)Polygon footprint (shoelace) |
| `geojson-geometry.ts` | Bbox, representative point, point-in-(multi)polygon, area and length in metres (UTM 30N) |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
