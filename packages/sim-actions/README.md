# `packages/sim-actions/`

- **Owner:** backend developer
- **Status:** Active — T-303

## Role

Data-driven action engine: conditions, effects and the action state machine (ADR 0004).

## How it works

Public API is exported from `src/index.ts` only. Profile: `pure`. The zone server owns the authoritative state and calls the engine; the client may use it as a non-authoritative preview (ARCHITECTURE §15.5).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
