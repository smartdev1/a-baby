# `apps/gateway/src/auth/`

- **Owner:** backend developer
- **Status:** Active — T-108, T-110

## Role

Session ticket checks.

| File | Role |
|---|---|
| `ticket-verifier.ts` | Port: consume a single-use ticket (sync in process, or async). |
| `http-ticket-verifier.ts` | Implementation for a gateway in its own process: `POST /internal/v1/session-tickets/consume` on the services process, 2 s timeout, fails closed. |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
