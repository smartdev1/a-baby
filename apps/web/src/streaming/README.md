# `apps/web/src/streaming/`

- **Owner:** frontend developer
- **Status:** Implemented — T-014, T-114 (J1 streaming foundation)

## Role

Tile streaming: which 250 m tiles to load around the player, LOD selection, Cache API, loading budget.

## How it works

Uses `@skyline/geo` keys and `@skyline/tile-format` schemas. Cancels obsolete loads with AbortSignal.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
