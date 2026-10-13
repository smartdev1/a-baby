# `packages/bus/`

- **Owner:** backend developer
- **Status:** Active — in-memory bus + typed world subjects (T-108); NATS bus (T-110)

## Role

MessageBus interface with typed subjects; in-memory implementation (tests, all-in-one) and NATS implementation (distributed).

## How it works

Public API is exported from `src/index.ts` only. Profile: `node`. `InMemoryBus` serves tests and the all-in-one process; `NatsBus` (JSON payloads, core NATS, no persistence) serves the multi-process mode.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
