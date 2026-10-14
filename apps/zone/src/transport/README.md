# `apps/zone/src/transport/`

- **Owner:** backend developer
- **Status:** Active — T-320 (J4-06, line rides), T-322 (J4-05, taxis)

## Role

Transport in the zone (ARCHITECTURE §17.3).

| File | Role |
|---|---|
| `transit-network.ts` | Lines of the pipeline (`08b-transit/transit-lines.ndjson`) + service profile of their mode (`content/transport/services`) → deterministic timetables (`@skyline/sim-transport`) at the nominal clock ratio; seats and flat fare of the mode |
| `ride-service.ts` | Line rides: boarding next to a stop of the line (25 m) where a vehicle is docked with a free seat, towards a later stop in an owned cell; fare `fare:{characterId}:{requestId}` to `system:transport`, once even on replay; accelerated trip (a sixth of the real trip time, 3 to 20 s) then arrival |
| `city-map.ts` | Road graph of the commune (`08-roads`) and drop point of every typed place (`13-places-sites`) |
| `taxi-service.ts` | Metered taxis: hailed within 30 m of a drivable road towards a place; virtual fleet ETA (deterministic, 2–6 game min); pickup only if the player waited by the road (40 m), fare = pickup + per km of the A* route charged once at pickup; accelerated drive (a sixth, 3 to 30 s); drop on the road in front of the place |
| `cell-rides.ts` | `CellTransport`: rides + taxis of a cell built from its daily life and cluster (a player busy with one is refused by the other); arriving passengers put on the ground |
| `transport-setup.ts` | Loads lines, city map and taxi fare at start-up |

## How it works

1. The client sends `rideRequest {requestId, lineId, toStopId}` (protocol v4) or `taxiRequest {requestId, destinationPlaceId}` (v6); the gateway forwards it on `cell.<key>.action`.
2. Accepted → `rideUpdate boarded` (fare, `arriveInMs`) and a `walletUpdate`; the rider leaves the snapshot and its movement inputs are acknowledged but ignored.
3. At `arriveInMs` the cell puts the player at the destination stop and sends `rideUpdate arrived`; a stop past the border is handed over to the neighbour cell like a walk.

Yopougon: lines + city map (7 629 places) + fare load in ≈ 320 ms; a taxi route averages 4.7 km, ≈ 1.3 ms of A*, ≈ 1 480 Djai. 341 lines alone load in ≈ 140 ms; at 08:00 the timetables put ≈ 4 500 vehicles on the road, all computed in ≈ 11 ms (they are never replicated: clients compute them too).

Not yet: riding seated in a visible vehicle and getting off before the stop (needs the client's vehicle views, J4-07), woro-woro "leave when full", taxi stations, a real taxi fleet with positions.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
