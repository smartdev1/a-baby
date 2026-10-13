# `data/`

- **Owner:** backend developer
- **Status:** Planned — T-022

## Role

Inputs and outputs of the map pipeline.

## How it works

Only `sources/sources.lock.json` is versioned. `cache/` (downloads) and `build/` (generated tiles) are git-ignored and published to object storage.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
