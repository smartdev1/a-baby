# `apps/gateway/src/transport/`

- **Owner:** backend developer
- **Status:** Planned — J1

## Role

WebSocket server (`ws`) behind the `TransportServer` interface.

## How it works

Swappable for uWebSockets.js if load tests require it.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
