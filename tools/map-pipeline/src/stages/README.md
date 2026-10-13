# `tools/map-pipeline/src/stages/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Pipeline stages, one folder per stage named `<nn>-<name>` (ARCHITECTURE §11.2).

## How it works

`stage-registry.ts` lists the stages in execution order. Adding a stage = a new folder with a `PipelineStage` implementation + its README + one line in the registry.

| Stage | Status |
|---|---|
| `01-source` | Active (local GeoJSON fixture) |
| acquire / extract / export (osmium) | T-022 |
| normalize / classify / heights | T-011 |
| tile-cut / encode / manifest | T-012 |

## Rules

- A stage only reads its declared inputs and writes its declared outputs (see `../runner/README.md`).
- No `Math.random`: use `../determinism/seeded-rng.ts`.
- Every source file starts with a `Role:` header comment; keep this README up to date.
