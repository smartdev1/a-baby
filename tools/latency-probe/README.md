# `tools/latency-probe/`

- **Owner:** backend developer
- **Status:** Active — T-019 (spike SP4 kit; measures to be run by the owner)

## Role

Measure the real network latency from Abidjan (Orange, MTN, Moov, fixed lines) to candidate hosting regions, to choose the region on facts (ARCHITECTURE Q7).

## How it works

| Piece | Role |
|---|---|
| `src/echo-server.mjs` | Tiny server for one region: serves the page and echoes WebSocket messages on `/echo` (max 256 bytes, no storage, no personal data) |
| `page/index.html`, `page/probe.mjs` | Tester page: 300 pings per region (5/s, ~1 min), shows p50 / p95 / jitter / loss, exports a JSON file |
| `src/rtt-stats.mjs` | Shared statistics (browser + Node), plain ESM so the server needs no build |
| `src/aggregate-results.mjs` | Merges the testers' JSON files into the SP4 Markdown table |

```bash
# local try
PORT=8080 PROBE_REGIONS='[{"id":"local","label":"Local","url":"ws://localhost:8080/echo"}]' pnpm --filter @skyline/latency-probe start
# aggregate the files received from testers
node tools/latency-probe/src/aggregate-results.mjs ./sp4-results/
```

Deployment (owner only, temporary instances): `infra/docker/latency-echo/Dockerfile`. Protocol and report: `docs/spikes/SP4-latency.md`.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
