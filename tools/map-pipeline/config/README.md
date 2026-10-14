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

`yopougon.neighbourhoods.json` (T-205, referenced by `neighbourhoodProfiles`): height profiles of the quartiers (level distributions or height ranges), the OSM neighbourhood name → profile table and name patterns. **To be reviewed by the owner** (`reviewedBy: null`); `06-heights/heights-report.json` lists the buildings per profile and the neighbourhoods still without profile.

Optional `facades.stripBayWalls` (default `false`): leaves the walls covered by facade bays out of `geom.glb`. Switch it to `true` once the client renders the facade kit (frontend J1-06); until then the walls stay so that buildings remain closed in the preview.

## Rules

- Paths are repository-relative with `/`; build output goes under `data/build/` (git-ignored).
