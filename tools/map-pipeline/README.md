# `tools/map-pipeline/`

- **Owner:** backend developer
- **Status:** Skeleton

## Role

Offline OSM → tiles pipeline (ARCHITECTURE §11).

## How it works

Deterministic (seeds derived from OSM ids), incremental, cross-platform. osmium runs only through Docker.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
