# `tools/map-pipeline/src/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Pipeline source code: `cli/` (entry point), `config/` (validated commune config), `runner/` (incremental stage runner), `determinism/` (seeded RNG), `stages/` (one folder per stage), `geometry/`, `heuristics/`, `writers/` (filled by T-011/T-012).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
