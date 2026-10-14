# `apps/zone/src/transport/`

- **Owner:** backend developer
- **Status:** Active — T-320 (J4-06, line rides); taxis planned (J4-05)

## Role

Transport in the zone (ARCHITECTURE §17.3).

| File | Role |
|---|---|
| `transit-network.ts` | Lines of the pipeline (`08b-transit/transit-lines.ndjson`) + service profile of their mode (`content/transport/services`) → deterministic timetables (`@skyline/sim-transport`) at the nominal clock ratio; seats and flat fare of the mode |
| `ride-service.ts` | Line rides: boarding next to a stop of the line (25 m) where a vehicle is docked with a free seat, towards a later stop in an owned cell; fare `fare:{characterId}:{requestId}` to `system:transport`, once even on replay; accelerated trip (a sixth of the real trip time, 3 to 20 s) then arrival |
| `cell-rides.ts` | Builds the ride service of a cell from its daily life and cluster; puts arriving riders on the ground at their stop |

## How it works

1. The client sends `rideRequest {requestId, lineId, toStopId}` (protocol v4); the gateway forwards it on `cell.<key>.action`.
2. Accepted → `rideUpdate boarded` (fare, `arriveInMs`) and a `walletUpdate`; the rider leaves the snapshot and its movement inputs are acknowledged but ignored.
3. At `arriveInMs` the cell puts the player at the destination stop and sends `rideUpdate arrived`; a stop past the border is handed over to the neighbour cell like a walk.

Yopougon: 341 lines load in ≈ 140 ms; at 08:00 the timetables put ≈ 4 500 vehicles on the road, all computed in ≈ 11 ms (they are never replicated: clients compute them too).

Not yet: riding seated in a visible vehicle and getting off before the stop (needs the client's vehicle views, J4-07), woro-woro "leave when full", taxis (J4-05).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
