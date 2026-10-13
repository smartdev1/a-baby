# `apps/web/src/net/`

- **Owner:** frontend developer
- **Status:** Planned — J1

## Role

Gateway client, clock sync, reconciliation, interpolation buffer.

## How it works

Uses `@skyline/protocol` only. Never trusts its own predictions for money or action results.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
