# `packages/economy-rules/`

- **Owner:** backend developer
- **Status:** Active — T-306 (EconomyPort contract, leg rules)

## Role

Pure Djai economy rules: price computation, price bounds, caps. Never writes balances.

## How it works

Public API is exported from `src/index.ts` only. Profile: `pure`. Contract and pure leg rules (J3); price bounds and caps come with businesses (J5/J6).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
