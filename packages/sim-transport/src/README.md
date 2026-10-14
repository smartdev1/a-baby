# `packages/sim-transport/src/`

- **Owner:** backend developer
- **Status:** Skeleton — J4

## Role

| File | Role |
|---|---|
| `road-graph.ts` | Graph from the pipeline's `road-nodes` / `road-edges`: arcs per mode (cars respect one-way streets, pedestrians do not), grid index for the nearest node (optionally on the main network) |
| `graph-components.ts` | Components per mode: strongly connected for cars (iterative Tarjan), plain for pedestrians (union-find); unreachable pairs refused at once |
| `route-search.ts` | A* (binary heap, straight-line heuristic) → node ids, edge ids, length, polyline |

Yopougon (18 162 nodes, 24 385 edges): graph built in ≈ 120 ms; main car network 15 070 nodes (90 %); 200 random routes ≈ 7.7 km: p50 1.9 ms, p95 7.6 ms (cars), p95 8.4 ms (pedestrians).

## How it works

Unit tests live next to the code (`*.test.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
