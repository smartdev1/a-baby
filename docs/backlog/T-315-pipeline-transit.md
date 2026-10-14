---
id: T-315
title: Pipeline stage `transit`: bus, gbaka and woro-woro lines from OSM route relations
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P2
size: M
---

## Context

Public transport lines exist in OSM as route relations (spike SP2 counted them). J4 needs them as game lines (stops, path, mode).

Jalon : **J4** (`docs/roadmap.md`, J4-03).

## User story

As a player, I want real lines of Yopougon (SOTRA bus, gbaka, woro-woro) so that I can travel like the inhabitants.

## Acceptance criteria
- [x] Given the OSM extract, When `transit` runs, Then route relations become lines with mode, name/ref, ordered stops and a path snapped to the road graph.
- [x] Given lines without stops or broken paths, Then they are reported and skipped.

## Out of scope

- Timetables and vehicles (J4-01).

## Technical notes

Owner review of modes and line names (woro-woro corridors are rarely mapped).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- Stage `08b-transit` (after `08-roads`, it needs the road edges): osmium `tags-filter` of `r/route=bus,share_taxi,minibus` **with** referenced objects → OPL → `src/transit/`.
- `src/osm/opl-format.ts`: shared OPL reader (tags, coordinates, members); `18-report/bus-routes.ts` now uses it.
- Mode (`line-mode.ts`): `gbaka` / `woro_woro` (also `route=share_taxi`) / `sotra_bus` (`monbus`, SOTRA) / `bus`, from `network`, `name`, `operator`.
- Path (`line-path.ts`): member ways in relation order, each from its road edges chained, oriented to continue the previous way; missing ways and gaps (m) measured. Not a re-snap through A*: ways are already road graph ways.
- Rejections: `too_few_stops` (< 2), `path_missing` (> half the ways outside the graph), `path_broken` (> 500 m of gaps).
- Outputs `transit-lines.ndjson`, `transit-report.json`; empty for fixture sources (golden unchanged).
- Yopougon: **341 lines** (woro-woro 143, gbaka 122, SOTRA bus 76), 1 594 stops, 2 567 km of paths; 337 rejected (path_missing 161 — lines mostly outside the commune, too_few_stops 130, path_broken 46).
- **Owner review needed**: mode table (network names), and whether lines leaving the commune should be cut at the border instead of rejected.


## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
