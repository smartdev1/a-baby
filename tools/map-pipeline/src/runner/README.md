# `tools/map-pipeline/src/runner/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Generic incremental stage runner, independent of any map logic.

## How it works

1. Each stage implements `PipelineStage` (`stage-contract.ts`): `id`, `version`, `outputs`, `inputFiles()`, `params()`, `run()`.
2. Before running a stage, `stage-cache.ts` hashes `id + version + params + content of every input file` (key-sorted JSON, sha256).
3. If `<outputDir>/stages/<id>/.stage-cache.json` has the same input hash **and** every output still has its recorded sha256, the stage is skipped (`cached`).
4. Otherwise the stage runs, then the cache record is written. A stage that does not write a declared output fails the build.
5. Stages chain through files: a stage declares the outputs of earlier stages as its inputs (`ctx.outputOf(stageId, file)`), so any upstream change re-runs everything downstream.

## Rules

- No hidden inputs: anything that changes a stage output must be in `inputFiles()` or `params()`.
- Every source file starts with a `Role:` header comment; keep this README up to date.
