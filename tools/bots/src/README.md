# `tools/bots/src/`

- **Owner:** backend developer
- **Status:** Active — T-108, T-110

## Role

Load-test bot sources.

| File | Role |
|---|---|
| `cli.ts` | Starts N bots, aggregates RTT, bandwidth, handoff and server statistics. |
| `bot-client.ts` | One bot: ticket → hello → seeded random walk or straight east walk at 20 Hz, 1 ping/s. |
| `handoff-tracker.ts` | Client-side handoff measurement (ack gap, position jump in absolute UTM). |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
