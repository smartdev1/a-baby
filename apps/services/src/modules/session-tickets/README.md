# `apps/services/src/modules/session-tickets/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

Single-use gateway tickets (128-bit, 60 s; only hashes kept), bound to the guest account — `POST /api/v1/session-tickets` with `Authorization: Bearer <access token>` (401 without, unless `SKYLINE_ANONYMOUS_TICKETS=true`: local dev and load tests; the all-in-one defaults to it), rate-limited per IP (`SESSION_TICKETS_PER_MIN`, default 10). `POST /internal/v1/session-tickets/consume` (`{ ticket }` → `{ valid, accountId }`) serves gateways running in another process: off unless `SERVICES_INTERNAL_ROUTES=true`, loopback callers only, no per-IP limit.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
