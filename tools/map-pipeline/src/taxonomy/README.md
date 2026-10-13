# `tools/map-pipeline/src/taxonomy/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

Turns OSM tags into game place categories `domain.kind` (`food.maquis`, `finance.mobile_money`, `worship.mosque`, `beauty.hairdresser`, `transport.stop`…).

| File | Role |
|---|---|
| `place-taxonomy.ts` | The table (key → value → category), defaults per key, worship by `religion` — extended from the legacy importer |
| `classify-record.ts` | `placeCategoryOf(tags)` and `classifyRecord` (building flag, place category for points AND areas, road class) |

## Rules

- `amenity=pub` is a **maquis** in Côte d'Ivoire.
- Changing the table changes outputs: bump `05-classify` version and update the golden hashes.
