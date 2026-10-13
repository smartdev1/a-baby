# `tools/map-pipeline/src/determinism/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Everything that keeps the pipeline reproducible: same snapshot + same config ⇒ same bytes.

## Contents

| File | Role |
|---|---|
| `seeded-rng.ts` | `createSeededRng(seed)` (xmur3 + sfc32) and `rngFor(pipelineSeed, osmId)` for per-object draws |

## Rules

- `Math.random` is forbidden in the pipeline (ESLint rule); always derive a generator from the config seed and the object id.
- Every source file starts with a `Role:` header comment; keep this README up to date.
