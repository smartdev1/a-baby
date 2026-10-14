# `packages/economy-rules/src/`

- **Owner:** backend developer
- **Status:** Skeleton — J6

## Role

| File | Role |
|---|---|
| `economy-port.ts` | `EconomyPort` contract of ARCHITECTURE §18 (commit request / result, account refs, bigint amounts) |
| `ledger-legs.ts` | Account kinds, accounts that must stay ≥ 0, leg validation, transfers → balanced legs |

## How it works

Unit tests live next to the code (`*.test.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
