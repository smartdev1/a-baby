# `tools/map-pipeline/src/osm/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

Reading raw OSM data safely.

| File                   | Role                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `osm-id.ts`            | Stable ids `osm:{node                                                                                                                                          | way | relation}/{id}` from osmium (`@type`, `@id`) or overpass (`way/123`) exports |
| `parse-osm-numbers.ts` | `building:levels` (`2;3` → 3, `R+2` → 3, decimals) and `height` (units, decimal comma, feet); implausible values (> 60 levels, > 250 m) → undefined, never NaN |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
