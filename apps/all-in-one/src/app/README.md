# `apps/all-in-one/src/app/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

| File | Role |
|---|---|
| `main.ts` | Composition root: start, listen, graceful shutdown |
| `compose-world.ts` | Builds services + zone cell (real collision tiles) + gateway on an in-memory bus |
| `all-in-one-config.ts` | Ports, world folder, spawn point from env |
| `all-in-one.e2e.test.ts` | Real WebSocket: ticket → hello → welcome + clock → inputs → acks |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
