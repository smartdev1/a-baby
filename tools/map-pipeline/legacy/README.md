# `tools/map-pipeline/legacy/`

- **Owner:** backend developer
- **Status:** Temporary

## Role

First prototype generator kept as reference during the rewrite.

## How it works

Excluded from lint and typecheck. Contains known bugs (0.25 scale, O(n²) roads, Math.random). Deleted once T-010..T-012 are done.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
