# `apps/zone/src/app/`

- **Owner:** backend developer
- **Status:** Active — T-110

## Role

Composition root of the standalone zone process (multi-process mode, NATS). The all-in-one mode composes `ZoneCell` itself (`apps/all-in-one`).

| File | Role |
|---|---|
| `main.ts` | One `ZoneCell` per owned cell, collision tiles loaded, NATS bus, optional stats endpoint. |
| `zone-config.ts` | `ZONE_CELLS`, `CLUSTER_CELLS`, `NATS_URL`, `SKYLINE_WORLD_DIR`, `SERVICES_URL`, `SPAWN_UTM`, `ZONE_STATS_PORT`. |
| `http-clock-source.ts` | World clock read from the services process, cached 5 s. |
| `stats-server.ts` | `GET /stats` (tick and handoff statistics) and `GET /economy` (money supply, sources, sinks) on 127.0.0.1. |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
