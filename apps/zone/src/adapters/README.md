# `apps/zone/src/adapters/`

- **Owner:** backend developer
- **Status:** Active — T-306

## Role

In-memory and NATS implementations of the ports.

| File | Role |
|---|---|
| `in-memory-economy.ts` | `EconomyPort` in memory (J3, until the PostgreSQL ledger of J6): all-or-nothing double-entry commits, player balances ≥ 0, idempotency by key (successful results only), starter grant `grant:starter:{characterId}` |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
