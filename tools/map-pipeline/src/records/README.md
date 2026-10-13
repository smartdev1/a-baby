# `tools/map-pipeline/src/records/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

Records exchanged between stages, stored as NDJSON (one JSON object per line).

| File              | Role                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `map-records.ts`  | `NormalizedRecord` → `ClassifiedRecord` → `BuildingRecord` types (UTM metres, cm precision; areas always MultiPolygon) |
| `ndjson-files.ts` | Streaming read / back-pressured write (constant memory on a whole commune)                                             |

## Rules

- Records keep the input order: outputs are byte-identical between runs (golden test).
