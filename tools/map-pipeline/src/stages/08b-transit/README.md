# `tools/map-pipeline/src/stages/08b-transit/`

- **Owner:** backend developer
- **Status:** Active — T-315

## Role

Commune extract (osmium, route relations `bus` / `share_taxi` / `minibus` with their referenced objects) + road edges (08) → `transit-lines.ndjson` (one line per relation kept) + `transit-report.json` (lines per mode, stops, km, rejections by reason). Fixture sources (no pbf) produce empty outputs. Logic in `src/transit/`. Numbered `08b` because it needs the road graph (ARCHITECTURE §11.2 lists `transit` as stage 10).

Yopougon (snapshot 2026-10-01): 341 lines kept (woro-woro 143, gbaka 122, SOTRA bus 76), 1 594 stops; 337 relations rejected (mostly lines that run outside the commune).

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
