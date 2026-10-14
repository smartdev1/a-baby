# `packages/sim-actions/src/`

- **Owner:** backend developer
- **Status:** Skeleton — J3

## Role

| File | Role |
|---|---|
| `actor-view.ts` | Read-only actor and place views the engine evaluates (needs, Djai, states, game minute, cooldowns, nearby people; place type, hours, site distance and capacity) |
| `action-conditions.ts` | Condition registry → refusal reasons (`wrong_place`, `too_far`, `no_free_site`, `place_closed`, `outside_hours`, `wrong_state`, `need_too_high/low`, `not_enough_money`, `cooldown`, `not_enough_people`); game-time windows across midnight |
| `action-effects.ts` | Effect registry → effect batch (need deltas, buffs, notifications, items, skill XP, **economy legs**: never a balance) |
| `action-ellipse.ts` | Real duration = min(game duration / ratio, `real.maxSeconds`); progress and continuous effects follow the real share, game effects apply in full |
| `outcome-draw.ts` | Weighted outcome drawn from the request id (hash), no `Math.random` |
| `action-run.ts` | State machine (pure reducer): requested → validated → reserved → running → completed → settled; rejected, timeout, interrupted, failed; illegal transitions throw |
| `action-settlement.ts` | Settlement keyed `action:{requestId}`: cost legs, completion and outcome effects, skill XP, cooldown; partial settlement on interruption (`onInterrupt`); `SettlementStore` returns the first result of a replayed request |

Adding an action = one JSON file. Adding a condition or an effect type = one function in its registry (+ its schema in `@skyline/content-schema` for effects).

## How it works

Unit tests live next to the code (`*.test.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
