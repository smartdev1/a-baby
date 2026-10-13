# `apps/gateway/src/session/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

`client-session.ts` (handshake: version + ticket, then inputs to the cell and cell messages back; malformed/flooding clients disconnected), `rate-limiter.ts` (token bucket 60/s, burst 120).

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
