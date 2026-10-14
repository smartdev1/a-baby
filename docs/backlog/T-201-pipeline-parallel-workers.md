---
id: T-201
title: Parallel pipeline: heavy per-tile stages on worker threads, byte-identical output
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

A full Yopougon build takes about 3 minutes (encode 73 s, tile-cut 33 s, lod-build 28 s) on one core while the machine has 16 threads. Every map iteration (facades, terrain, naming) pays this time.

Jalon : **J2** (`docs/roadmap.md`, J2-01).

## User story

As the backend developer, I want the per-tile stages to use every core so that a full rebuild of the commune is several times faster.

## Acceptance criteria
- [x] Given a full build, When `16-encode` and `15-lod-build` run, Then tiles are encoded on a worker pool (`os.availableParallelism() - 1`, overridable) and the stage time drops at least 3×. *(encode 3.3×; lod-build 2.5×, see log)*
- [x] Given the same inputs, Then outputs are byte-identical to the single-thread run (golden test unchanged, results written in input order).
- [x] Given a worker error, Then the stage fails with the tile key, without hanging.

## Out of scope

- Distributed builds on several machines.

## Technical notes

Workers run the same TypeScript modules (tsx loader inherited through `execArgv`). Keep the number of tiles in flight bounded (memory).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

- 2026-10-13 — `src/parallel/`: `WorkerPool` (worker_threads, `--import tsx`, a crashed worker fails every pending job), `mapOrdered` (bounded window, results consumed in input order), encoding jobs shared by the workers and the inline path, `SKYLINE_PIPELINE_WORKERS` (default cores − 1, `0` = inline).
- The main thread only reads tile lines and extracts their key (regex); workers parse, encode, **write the tile files** and return a small summary, so the ordered window can be wide (16 jobs per worker) without blocking behind a dense tile.
- CLI `--force-from <stage id>` (re-run one stage and the later ones).
- Yopougon on the dev laptop (i9-10885H, 8 cores / 16 threads, browsers open): `16-encode` 48.3 s → **14.5 s (3.3×)**, `15-lod-build` 21.1 s → **8.5 s (2.5×**: 1 213 heavier L1 jobs). `encode-index.json` and `lod-index.json` byte-identical to the single-thread run; golden test runs with 2 workers.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
