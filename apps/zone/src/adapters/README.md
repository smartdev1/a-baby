# `apps/zone/src/adapters/`

- **Owner:** backend developer
- **Status:** Active — T-306

## Role

In-memory and NATS implementations of the ports.

| File | Role |
|---|---|
| `in-memory-economy.ts` | `EconomyPort` in memory (J3, until the PostgreSQL ledger of J6): all-or-nothing double-entry commits, player balances ≥ 0, idempotency by key (successful results only), starter grant `grant:starter:{characterId}` |
| `journaled-economy.ts` | `EconomyPort` = in-memory ledger + append-only journal `data/runtime/ledger*.ndjson` (each successful commit appended before it is returned, replayed at start-up, truncated last line skipped) until the PostgreSQL ledger |
| `file-character-store.ts` | `CharacterStorePort` in memory (tests) and as one JSON file per character in `data/runtime/characters` until the characters service |
| `in-memory-chat-reports.ts` | `ChatReportPort` in memory until the moderation service (J7-04): last 1 000 reports; logs ids and reason, never the text |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
