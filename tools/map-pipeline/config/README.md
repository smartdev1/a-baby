# `tools/map-pipeline/config/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

One pipeline configuration per commune, validated by `src/config/pipeline-config-schema.ts`.

| File                     | Use                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `fixture.pipeline.json`  | Golden fixture (~1 km² OSM sample of Yopougon). Used by tests and to try the pipeline without downloading anything |
| `yopougon.pipeline.json` | Whole commune. Needs the OSM snapshot (T-022) and the boundary relation id (spike SP2, T-018)                      |

Adding a commune (e.g. Attécoubé) = adding a config file.

## Rules

- Paths are repository-relative with `/`; build output goes under `data/build/` (git-ignored).
