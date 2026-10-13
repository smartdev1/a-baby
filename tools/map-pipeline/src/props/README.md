# `tools/map-pipeline/src/props/`

- **Owner:** backend developer
- **Status:** Active — T-104

## Role

Street furniture and vegetation, placed offline and deterministically.

| File | Role |
|---|---|
| `placement-guards.ts` | flatbush indexes: inside a building? on a carriageway? yaw towards the nearest road |
| `street-furniture.ts` | Street lights (primary/secondary 30 m alternating, tertiary 35 m, residential 40 m one side, 1.2 m from the kerb); kiosks + a bin and bus stops (sign or shelter) at their real OSM points, facing the road |
| `vegetation.ts` | OSM `natural=tree` at their points; seeded jittered grids in forests (7 m), parks (14 m), scrub (9 m); capped per polygon |
| `placed-instance.ts` | Instance in UTM metres before the tile cut |

Module names come from `@skyline/tile-format` `INSTANCE_MODULES` (shared with the frontend, append-only).
