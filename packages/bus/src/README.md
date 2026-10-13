# `packages/bus/src/`

- **Owner:** backend developer
- **Status:** Active — T-108, T-110

## Role

Source code of @skyline/bus.

| File | Role |
|---|---|
| `message-bus.ts` | `MessageBus` interface. |
| `in-memory-bus.ts` | Synchronous in-process bus (tests, all-in-one). |
| `nats-bus.ts` | NATS implementation (JSON codec); handler errors reported, never thrown into the subscription loop. |
| `world-subjects.ts` | Typed subjects: cell join / input / handoff / snapshot, session out, session closed. |

## How it works

Unit tests live next to the code (`*.test.ts`). `nats-bus.test.ts` runs only when `SKYLINE_NATS_TEST_URL` points to a NATS server (e.g. `infra/compose/nats.compose.yml`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
