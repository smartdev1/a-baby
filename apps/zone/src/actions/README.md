# `apps/zone/src/actions/`

- **Owner:** backend developer
- **Status:** Active — T-308

## Role

Daily life of a cell: the pure engines (`@skyline/sim-actions`, `@skyline/sim-needs`) bound to the authoritative world.

| File | Role |
|---|---|
| `daily-life-content.ts` | Actions, place types and needs config read from `content/` and validated at start |
| `daily-life-setup.ts` | Dependencies of a cell: content, places and sites of the cell (tile meta), economy, world clock cached (10 s refresh) |
| `daily-life.ts` | Orchestrator: request → conditions (needs, Djai, hours, place, site distance and capacity, cooldown) → site reserved → run at 1 Hz with the ellipse → settlement once (`action:{characterId}:{requestId}`) through the EconomyPort → needs, cooldowns, buffs, `action_update` / `needs_update` / `wallet_update`; walk-away, cancel, disconnection and handoff interrupt |
| `player-life.ts` | Per player: needs snapshot, confirmed Djai, cooldowns, buffs, running action, last update per request (replays), serial queue |
| `site-reservations.ts` | Site capacity per place and kind |
| `group-lobby.ts` | Lobbies of group actions (`participants.mode: group`): wait at the place, start when full or when the 60 s joining window ends with enough players, else refuse (`not_enough_players`) |

## How it works

- `ZoneCell` creates `DailyLife` when given `daily` deps; it provides positions and nearby counts, forwards `cell.<key>.action` (from the gateway), adds players on join / handoff (needs carried in `CellHandoff`) and removes them on close / handoff.
- **Idempotency keys are scoped per character**: ledger key `action:{characterId}:{requestId}`, settlements and site reservations per player. A global `action:{requestId}` (ARCHITECTURE §18) would let another player replay someone else's request id to get the effects without paying, or take a site without a free slot (T-309).
- New characters receive the starter grant once (`grant:starter:{characterId}`, `SKYLINE_STARTER_DJAI`).
- J3 limits: guest character id = session id; one in-memory ledger per process (not shared between zone processes until J6).

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
