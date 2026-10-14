# `packages/sim-transport/src/`

- **Owner:** backend developer
- **Status:** Active — J4 (T-314 routing, T-316 line vehicles)

## Role

| File | Role |
|---|---|
| `road-graph.ts` | Graph from the pipeline's `road-nodes` / `road-edges`: arcs per mode (cars respect one-way streets, pedestrians do not), grid index for the nearest node (optionally on the main network) |
| `graph-components.ts` | Components per mode: strongly connected for cars (iterative Tarjan), plain for pedestrians (union-find); unreachable pairs refused at once |
| `route-search.ts` | A* (binary heap, straight-line heuristic) → node ids, edge ids, length, polyline |
| `polyline-measure.ts` | Measured path: cumulative lengths, point and heading at a distance, forward projection of stops |
| `line-schedule.ts` | Timetable of a line from its mode's service profile: trip plan (visible speed converted with the nominal clock ratio, dwell at every stop), departures of any game-time interval with stable service ids `day.period.k`, per-line phase (FNV-1a) so lines do not all leave together |
| `line-vehicles.ts` | Line vehicles as a pure function of game time (ARCHITECTURE §17.3): vehicles on the road, vehicle docked at a stop (boarding), next arrival at a stop |

Line vehicles are never replicated: client and server compute the same positions from the same timetable and game time.

Yopougon (18 162 nodes, 24 385 edges): graph built in ≈ 120 ms; main car network 15 070 nodes (90 %); 200 random routes ≈ 7.7 km: p50 1.9 ms, p95 7.6 ms (cars), p95 8.4 ms (pedestrians).

## How it works

Unit tests live next to the code (`*.test.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
