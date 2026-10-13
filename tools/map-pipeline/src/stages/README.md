# `tools/map-pipeline/src/stages/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Pipeline stages, one folder per stage named `<nn>-<name>` (ARCHITECTURE §11.2).

## How it works

`stage-registry.ts` (`stagesFor(config)`) lists the stages in execution order: fixture = `01-source → 03-export`; OSM snapshot = `01-acquire → 02-extract → 03-export`; then both `04-normalize → 05-classify → 06-heights → 08-roads → 09-naming → 10-terrain → 12-props → 14-tile-cut → 15-lod-build → 16-encode → 17-manifest → 18-report`. `pipeline-golden.test.ts` checks byte-identical outputs on the fixture. Adding a stage = a new folder with a `PipelineStage` implementation + its README + one line in the registry.

| Stage | Status |
|---|---|
| `01-source` | Active (local GeoJSON fixture) |
| `01-acquire` | Active (frozen Geofabrik snapshot) |
| `02-extract` | Active (osmium bbox extract + tags filter) |
| `03-export` | Active (GeoJSONSeq, both sources) |
| `18-report` | Active (coverage report, spike SP2) |
| `04-normalize` | Active (stable ids, UTM metres, parsed tags) |
| `05-classify` | Active (buildings, place categories, roads) |
| `06-heights` | Active (levels and heights with source) |
| `08-roads` | Active (road and pedestrian graph, sidewalks, components) |
| `09-naming` | Active (displayed names: toponyms, parodied brands, deformed shop names) |
| `10-terrain` | Active (relief from Copernicus DEM, water, road levelling) |
| `12-props` | Active (street furniture and vegetation instances) |
| `14-tile-cut` | Active (250 m tiles, clipped geometry) |
| `15-lod-build` | Active (L1 500 m render tiles) |
| `16-encode` | Active (geom.glb, collision.bin, meta.json, budgets) |
| `17-manifest` | Active (world manifest of the release) |

## Rules

- A stage only reads its declared inputs and writes its declared outputs (see `../runner/README.md`).
- No `Math.random`: use `../determinism/seeded-rng.ts`.
- Every source file starts with a `Role:` header comment; keep this README up to date.
