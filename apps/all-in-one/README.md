# `apps/all-in-one/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

All-in-one mode (ARCHITECTURE §6.3): **one Node process** hosting the services (HTTP), one zone cell and the WebSocket gateway, linked by an in-memory bus. Used for development, tests and J1–J4.

```bash
pnpm map:build --config tools/map-pipeline/config/yopougon.pipeline.json   # once, for real collisions
pnpm dev:server                                                            # HTTP :8080, WebSocket :2567/ws
```

- Spawn: `SKYLINE_SPAWN_LONLAT` (default Pigeons, Yopougon) → its 1 km cell is loaded with its collision tiles + one ring of neighbours from `SKYLINE_WORLD_DIR`. Without a pipeline build, the cell is flat and empty (warning).
- Dev statistics: `GET /api/v1/dev/zone-stats` (tick p50 / p95 / max, players, tiles loaded).
- **Architecture exception (owner to confirm):** this app is the only one allowed to import other apps, and only their public `src/index.ts` (dependency-cruiser rules `apps-do-not-import-apps` + `all-in-one-uses-public-app-entries-only`). It contains composition only.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
