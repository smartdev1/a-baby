# `tools/map-pipeline/src/parallel/`

- **Owner:** backend developer
- **Status:** Active — T-201

## Role

Runs the per-tile work of the pipeline on every core, with byte-identical outputs.

| File | Role |
|---|---|
| `worker-pool.ts` | Fixed pool of `worker_threads` (TypeScript through `--import tsx`); queued jobs; a crashed worker fails every pending job |
| `ordered-map.ts` | `mapOrdered`: bounded number of jobs in flight, results consumed strictly in input order |
| `encode-jobs.ts` | The encoding jobs (L0 tile files, L1 render tile), shared by the worker and the inline path |
| `encode-worker.ts` | Worker entry: runs jobs, posts encoded files back |
| `tile-encoder-pool.ts` | Pool or inline encoder from `SKYLINE_PIPELINE_WORKERS` (default: available cores − 1; `0` = inline) |

## How it works

Stages read their input in order, `mapOrdered` sends jobs to the pool (at most 3 per worker in flight) and writes the results in the same order as the single-thread path, so files, hashes and indexes do not change. Used by `16-encode` (L0) and `15-lod-build` (L1).

## Rules

- Jobs are pure functions of their input (no shared state, no `Math.random`).
- Every source file starts with a `Role:` header comment; keep this README up to date.
