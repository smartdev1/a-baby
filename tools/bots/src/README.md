# `tools/bots/src/`

- **Owner:** backend developer
- **Status:** Active — T-108, T-110, T-323 (scenarios)

## Role

Load-test bot sources.

| File | Role |
|---|---|
| `cli.ts` | Starts N bots (`--walk random|east|market|social`, `--place` for the taxi of `social`), aggregates RTT, bandwidth, entities per snapshot, chat fan-out, taxi states, handoff and server statistics. |
| `bot-client.ts` | One bot: ticket → hello → its scenario at 20 Hz, 1 ping/s; counts server messages per type. |
| `bot-scenarios.ts` | Scenarios: `random`, `east` (border crossings), `market` (crowd converging 40 m north of the spawn), `social` (random walk + chat every 5 s + one taxi request). |
| `handoff-tracker.ts` | Client-side handoff measurement (ack gap, position jump in absolute UTM). |

## Measures (T-323, all-in-one, 300 bots, 25 s)

| Scenario | Acks /bot/s | Down kbit/s /bot | Entities /snapshot | Tick p95 | Other |
|---|---|---|---|---|---|
| `market` | 20 | 199 | 128 (caps 64 + 128 at work) | 15.8 ms | — |
| `social` | 19.9 | 204 | 128 | 20.2 ms | 1 488 chat lines, 63.6 deliveries each (cap 64); taxis: assigned / boarded for bots by a road, `no_road_nearby` for the others |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
