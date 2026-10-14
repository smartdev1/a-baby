# `packages/sim-needs/src/`

- **Owner:** backend developer
- **Status:** Skeleton — J3

## Role

| File | Role |
|---|---|
| `needs-state.ts` | `NeedsSnapshot` (values + game minute): `initialNeeds`, `advanceNeeds` (linear decay, clamped, never back in time), `resumeNeeds` (offline freeze), `applyNeedDeltas` |
| `needs-effects.ts` | Penalties of empty needs, warnings, derived morale (mean pulled down by the lowest need), hours until empty |

## How it works

Unit tests live next to the code (`*.test.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
