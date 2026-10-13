# `tools/bots/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

Headless load-test clients.

## Usage

```bash
SESSION_TICKETS_PER_MIN=1000 pnpm dev:server
pnpm --filter @skyline/bots start -- --bots 50 --seconds 30
```
Each bot: ticket → hello → random seeded walk at 20 Hz + 1 ping/s. Prints welcomes, acks per second, RTT p50/p95, errors and the zone tick statistics.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
