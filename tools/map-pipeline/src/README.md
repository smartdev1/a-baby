# `tools/map-pipeline/src/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Pipeline source code: `cli/` (entry point), `config/` (validated commune config), `runner/` (incremental stage runner), `determinism/` (seeded RNG), `stages/` (one folder per stage), `osm/`, `records/`, `taxonomy/`, `heuristics/`, `tiling/`, `meshing/`, `encoding/`, `geometry/`, `sources/`, `osmium/`, `roads/`, `naming/`, `terrain/`, `facades/`, `props/`, `lod/`, `parallel/` (worker pool for per-tile stages), `writers/` (reserved). Each folder README lists its files.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
