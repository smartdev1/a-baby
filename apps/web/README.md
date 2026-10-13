# `apps/web/`

- **Owner:** frontend developer
- **Status:** Active

## Role

Browser client: 3D rendering (Babylon.js), tile streaming, inputs, local prediction, UI (Preact).

## How it works

Built with Vite. Talks only to the HTTP API, the gateway WebSocket and the CDN. Never decides a gain, a cost or an action result.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
