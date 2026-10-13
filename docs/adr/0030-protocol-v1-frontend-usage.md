# ADR 0030 — Protocol v1 Frontend Usage

## Status
Accepted

## Context
The `@skyline/protocol` package (v0.1.0) defines the bounded binary client↔gateway network protocol: message types, bounded codecs, error handling, and round-trip property tests. It is used by the gateway (`apps/gateway/src/transport/ws-gateway.ts`) and the bus layer (`packages/bus/src/world-subjects.ts`) for session management, input propagation, and cell handoff.

No frontend client code in `apps/web/` or other client packages currently imports from `@skyline/protocol`. The web client communicates with the gateway via the WebSocket binary protocol but does not depend on the `@skyline/protocol` TypeScript types.

## Decision
- **Protocol v1 is a backend-only contract.** The `@skyline/protocol` package must not be imported directly from frontend client code (`apps/web/src/`).
- If future frontend consumption is needed, a **thin adapter layer** must be introduced in `apps/gateway/` that translates protocol messages into a frontend-safe JSON format, rather than importing `@skyline/protocol` types directly in client code.
- All protocol message types (`ClientMessage`, `ServerMessage`, `PingMessage`, `HelloMessage`, etc.) are considered **backend-internal** and should not appear in `apps/web/package.json` dependencies or client-side type bundles.
- Any future frontend need for protocol awareness must go through the gateway's HTTP/JSON bridge or a explicitly designed adapter, preserving the backend-only boundary.

## Consequences
- **Positive:** Clear separation between backend protocol layer and frontend client; no risk of frontend code depending on bounded binary codecs or internal message schemas; easier protocol evolution without frontend breakage.
- **Negative:** If frontend needs direct protocol access, an adapter layer must be built (initial overhead); prevents "quick import" anti-pattern where frontend reads protocol types directly.

## Risks and Mitigations
- Risk: Someone imports `@skyline/protocol` from frontend code to avoid writing an adapter. Mitigation: ESLint rule (repo-check) flags unknown external imports in `apps/web/`; CI fails on unauthorized `from '@skyline/protocol'` statements.
- Risk: Protocol changes break backend↔gateway communication without frontend impact. Mitigation: The protocol already has round-trip fuzz tests (`packages/protocol/src/messages-roundtrip.test.ts`); changes are validated independently of frontend.

## Related
- ADR 0003 — Colyseus retired (protocol v1 replaces Colyseus messages)
- T-015 — Retire Colyseus server skeleton, contracts, game-config and archive the Prisma schema
- packages/protocol — Source of protocol v1 definition
- apps/gateway — Gateway implementation using protocol v1

---
*Decision: Protocol v1 consumption from frontend is **not permitted**. Any future frontend protocol needs must go through a gateway adapter layer.*