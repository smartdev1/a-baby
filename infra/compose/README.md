# `infra/compose/`

- **Owner:** backend developer
- **Status:** Active — T-110 (NATS); PostgreSQL and observability planned

## Role

Development Compose files, prepared for the owner (agents never start them in shared environments).

| File | Role |
|---|---|
| `nats.compose.yml` | Local NATS (image pinned by digest, port 4222 on 127.0.0.1) for the multi-process mode: zone processes + gateway + services. |

## Multi-process mode (spike SP3)

```bash
docker compose -f infra/compose/nats.compose.yml up -d
SERVICES_INTERNAL_ROUTES=true SESSION_TICKETS_PER_MIN=100000 pnpm --filter @skyline/services start
ZONE_CELLS=C_81_49 CLUSTER_CELLS=C_81_49,C_82_49 SPAWN_UTM=381940,589300 ZONE_STATS_PORT=9191 pnpm --filter @skyline/zone start
ZONE_CELLS=C_82_49 CLUSTER_CELLS=C_81_49,C_82_49 ZONE_STATS_PORT=9192 pnpm --filter @skyline/zone start
SPAWN_CELL=C_81_49 pnpm --filter @skyline/gateway start
pnpm --filter @skyline/bots start -- --bots 500 --seconds 30 --walk east --stats http://127.0.0.1:9191/stats,http://127.0.0.1:9192/stats
```

Results: `docs/spikes/SP3-mmo.md`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
