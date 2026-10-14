# `tools/map-pipeline/src/transit/`

- **Owner:** backend developer
- **Status:** Active — T-315

## Role

Public transport lines from the OSM route relations (stage `08b-transit`).

| File | Role |
|---|---|
| `line-mode.ts` | Game mode from `route` / `network` / `name`: `gbaka`, `woro_woro` (also `route=share_taxi`), `sotra_bus` (`monbus`, SOTRA), `bus` |
| `line-path.ts` | Path rebuilt from the member ways in order, each way from its road graph edges (chained), oriented to continue the previous one; missing ways and gaps measured |
| `transit-lines.ts` | Lines: mode, ref, name (public transport names are real, ADR 0010), stops (`stop` / `platform` members, UTM), path; rejected when < 2 stops (`too_few_stops`), more than half the ways missing (`path_missing`) or > 500 m of gaps (`path_broken`) |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
