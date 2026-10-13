# `apps/gateway/src/app/`

- **Owner:** backend developer
- **Status:** Active — T-110

## Role

Composition root of the standalone gateway process (multi-process mode).

| File | Role |
|---|---|
| `main.ts` | NATS bus, tickets checked through the services process, WebSocket transport. |
| `gateway-config.ts` | `GATEWAY_PORT`, `NATS_URL`, `SERVICES_URL`, `SPAWN_CELL`. |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
