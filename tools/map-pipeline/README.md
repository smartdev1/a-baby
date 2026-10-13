# `tools/map-pipeline/`

- **Owner:** backend developer
- **Status:** Active — runner and CLI (T-010); business stages in T-011, T-012, T-022

## Role

Offline OSM → tiles pipeline (ARCHITECTURE §11).

## How it works

Deterministic (seeds derived from OSM ids), incremental, cross-platform. osmium runs only through Docker.

## Usage

```bash
pnpm map:build --config tools/map-pipeline/config/fixture.pipeline.json          # incremental
pnpm map:build --config tools/map-pipeline/config/fixture.pipeline.json --force  # re-run every stage
```

Output: `data/build/<commune>/stages/<nn>-<stage>/` (git-ignored). Folders: `src/cli` (command), `src/config` (validated config), `src/runner` (incremental runner), `src/determinism` (seeded RNG), `src/stages` (one folder per stage), `config/` (one file per commune), `legacy/` (prototype code, reference only).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
