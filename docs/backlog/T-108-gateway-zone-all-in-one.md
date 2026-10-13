---
id: T-108
title: `apps/gateway` + `apps/zone` minimal, all-in-one mode, in-memory bus, one cell
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context
Movement must be validated by an authoritative server from J1 (ARCHITECTURE §13).

Jalon : **J1** (`docs/roadmap.md`, J1-13). Dépend de : T-106, T-107. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want my movement validated by a local server so that the multiplayer foundation exists from day one.

## Acceptance criteria
- [x] Given `pnpm dev:server`, Then one Node process hosts gateway + zone + services with an in-memory bus.
- [x] Given a client connection with a session ticket, Then the zone runs a 20 Hz tick, applies inputs through `@skyline/physics`, rejects impossible moves and sends snapshots + acks.
- [x] Given 50 headless bots (`tools/bots`), Then tick p95 ≤ 25 ms on a dev machine.
- [x] Given `/health` and `/ready`, Then they reflect the zone state; logs and tick metrics go through `@skyline/observability`.

## Out of scope
- Several cells, NATS (J5).

## Technical notes
ARCHITECTURE §6.3, §13. All-in-one = no DB needed yet (in-memory adapters).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13:
  - `@skyline/bus`: `MessageBus` port, `InMemoryBus`, typed world subjects (`cell.{key}.join|input|leave`, `session.{id}.out`).
  - `apps/zone`: `ZoneCell` (20 Hz, inputs simulated with `@skyline/physics`, acks every tick, snapshots 10 Hz, welcome + world clock on join), `PlayerSlot` (replays refused, ≤ 2 inputs per tick, violation limit), cell collision loader from a pipeline release (cell + neighbour ring, frame origin = cell SW corner).
  - `apps/gateway`: `ClientSession` (hello first, version check, single-use ticket, routing to the spawn cell, token bucket 60/s, disconnect after 20 violations), `ws` transport on `/ws` (binary ≤ 1 KB).
  - `apps/services`: `session-tickets` module (`POST /api/v1/session-tickets`, 128-bit, 60 s, hashed, per-IP limit `SESSION_TICKETS_PER_MIN`), `buildServices` shared by main and all-in-one.
  - **`apps/all-in-one`** (new): composition root, `pnpm dev:server`; dev stats `GET /api/v1/dev/zone-stats`. Architecture exception: it may import other apps' public `src/index.ts` only (dependency-cruiser) — **owner to confirm** and to add `apps/all-in-one/` to `.claude/ownership.json` (backend).
  - `tools/bots`: load-test CLI.
- Measures (Linux dev machine, all-in-one, cell C_81_49 with 36 real Yopougon collision tiles): 50 bots × 30 s, all welcomed, 20 acks/bot/s, 0 errors, **tick p50 1.9 ms, p95 3.7 ms, max 6.6 ms** (criterion ≤ 25 ms). The per-IP ticket limit correctly refused 40 of 50 bots at the default 10/min (bots run with a raised limit).
- Tests: zone cell (3), gateway session (4), tickets (3), e2e WebSocket (1).

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
