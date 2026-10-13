# `tools/map-pipeline/src/stages/18-report/`

- **Owner:** backend developer
- **Status:** Active — T-018 (spike SP2)

## Role

Measures the OSM coverage of the commune and writes `coverage-report.json`, `coverage-report.md` and `building-density.svg`.

| File | Role |
|---|---|
| `report-stage.ts` | Stage orchestration (stream features, bus routes via osmium, write outputs) |
| `feature-stream.ts` | Streams `features.geojsonseq` line by line |
| `feature-kinds.ts` | Building / road class / POI category from tags |
| `coverage-stats.ts` | Accumulator: buildings, heights, road km per class, POIs, buildings per L0 tile (clipped to the boundary) |
| `gap-cover.ts`, `gap-tiles.ts` | Classifies building-free tiles by land cover (water, forest, farmland… or unmapped) |
| `bus-routes.ts` | Parses route relations from OPL (gbaka, woro-woro, bus) |
| `density-svg.ts` | Static density map (sequential blue bins, hatched gaps) |
| `report-markdown.ts` | Figures as Markdown tables |

The human analysis lives in `docs/spikes/SP2-osm-coverage.md`.

## Rules

- Bump the stage `version` whenever the output format or a computation changes (the runner does not hash code).
- Every source file starts with a `Role:` header comment; keep this README up to date.
