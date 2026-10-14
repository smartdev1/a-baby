# `apps/gateway/src/session/`

- **Owner:** backend developer
- **Status:** Active — T-108, T-321 (resume)

## Role

| File | Role |
|---|---|
| `client-session.ts` | One connection: handshake (version + single-use ticket, or resume token), inputs / actions / rides / chat to the player's cell, cell messages back; a dropped connection is suspended 60 s, a kicked one (malformed, flooding) ends the session at once |
| `resume-registry.ts` | Sessions alive per gateway: resume tokens (32 random bytes, only their SHA-256 kept, single use, rotated at each handshake), 60 s expiry of dropped sessions, one live connection per session (the newer replaces the older with `session_replaced`) |
| `rate-limiter.ts` | Token bucket 60/s, burst 120 |

## Resume (ARCHITECTURE §13.6)

1. After each successful handshake the client receives `resumeInfo {resumeToken, windowS: 60}`.
2. The socket drops: the player stays in its cell (idle) and nothing is announced.
3. Within 60 s, `hello {resumeToken}` on a new socket takes the same session back: the cell welcomes the player again where it stands (needs and wallet re-sent) and a new token is issued. After 60 s, `session.closed` is published and the cells forget the player.

The registry lives in the gateway process: a resume must reach the same gateway until a shared store (J5-02, JetStream KV).

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
