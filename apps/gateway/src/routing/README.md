# `apps/gateway/src/routing/`

- **Owner:** backend developer
- **Status:** Active — T-110

## Role

Routes cell traffic to the sessions of this gateway.

| File | Role |
|---|---|
| `cell-fanout.ts` | One subscription per cell with local players; each snapshot is encoded once and the same frame is sent to every session in the cell. |

The session itself switches cell when a new cell sends `welcome` after a border handoff (`session/client-session.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
