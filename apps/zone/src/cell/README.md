# `apps/zone/src/cell/`

- **Owner:** backend developer
- **Status:** Planned — J1

## Role

CellRuntime, 20 Hz tick loop, entity registry.

## How it works

Tick order: inputs → physics → actions → needs → transport → NPCs → interest → snapshots.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
