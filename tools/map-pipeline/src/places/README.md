# `tools/map-pipeline/src/places/`

- **Owner:** backend developer
- **Status:** Active — T-305

## Role

Game place types and action sites of the OSM places (stage `13-places-sites`).

| File | Role |
|---|---|
| `place-type-catalogue.ts` | Place types of `content/place-types` (validated by `@skyline/content-schema`); game category → place type, a category may belong to one type only |
| `site-placement.ts` | Site positions: `inside` (place point if in a building, else the centre of the place's footprint), `front` (from inside the building towards the nearest car road until outside, + 1.5 m; several front sites side by side every 2.5 m), `around` (1–3 m around a street place, seeded); `yawRad` = direction the actor faces |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
