# `tools/map-pipeline/test/golden/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

Committed sha256 of the pipeline outputs on the Pigeons fixture (`pigeons-fixture.sha256.json`), checked by `src/stages/pipeline-golden.test.ts` on every `pnpm test`.

## How it works

- The test builds the fixture twice in temporary folders: both runs must be byte-identical (determinism), and equal to this file.
- An intended output change: bump the stage `version`, run `UPDATE_GOLDEN=1 pnpm test`, review and commit the new hashes in the same PR.
