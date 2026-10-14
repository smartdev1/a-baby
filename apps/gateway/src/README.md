# `apps/gateway/src/`

- **Owner:** backend developer
- **Status:** Active

## Role

Gateway source code: `app/` (config, entry point), `auth/` (session tickets), `transport/` (WebSocket server), `session/` (one client connection), `routing/` (cell snapshot fan-out), `interest/` (per-client interest sets), `backpressure/` (planned).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
