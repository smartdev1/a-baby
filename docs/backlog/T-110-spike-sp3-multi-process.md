---
id: T-110
title: Spike SP3 (start): 2 zone processes + NATS, entity handoff
status: done
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: L
---

## Context

No player cap means several processes; handoff between cells is the riskiest MMO piece.

Jalon : **J1** (`docs/roadmap.md`, J1-18). Dépend de : T-108. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As the owner, I want to know early if seamless cell handoff works so that the MMO architecture is validated.

## Acceptance criteria
- [x] Given 2 zone processes owning adjacent cells and a NATS bus, When a bot walks across the border, Then it is handed off in < 100 ms without visible jump.
- [x] Given 500 bots, Then a report `docs/spikes/SP3-mmo.md` gives tick p95, handoff time, bandwidth per player.

## Out of scope

- Production NATS cluster.

## Technical notes

ADR 0003. Running NATS locally in Docker needs the owner's approval.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — Multi-process mode + border handoff:
  - `@skyline/bus`: `NatsBus` (nats.js 2.29, already a dependency; JSON codec), subjects `cell.<key>.handoff`, `cell.<key>.snapshot`, `session.closed` (replaces the per-cell leave). Integration test gated by `SKYLINE_NATS_TEST_URL`.
  - `apps/zone`: `handoff/cell-handoff.ts` (exit detection, absolute UTM state, FNV-1a entity id from the session id), `handoff/input-forwarding.ts` (inputs still routed to the old cell forwarded for 2 s); `ZoneCell` option `clusterCells` (crossing into an unowned cell is undone), one snapshot per cell instead of one per player; standalone `app/main.ts` (env `ZONE_CELLS`, `CLUSTER_CELLS`, `NATS_URL`, `SERVICES_URL`, `SPAWN_UTM`, `ZONE_STATS_PORT`).
  - `apps/gateway`: session follows the cell named by each `welcome` (inputs + snapshots); `routing/cell-fanout.ts` (one subscription per cell, snapshot encoded once per gateway); async ticket check with `HttpTicketVerifier` (fails closed); standalone `app/main.ts`.
  - `apps/services`: `POST /internal/v1/session-tickets/consume`, off by default (`SERVICES_INTERNAL_ROUTES`), loopback callers only.
  - `tools/bots`: `--walk east`, `--stats` (several endpoints), received bytes and handoff measurement (`handoff-tracker.ts`).
  - `infra/compose/nats.compose.yml`: NATS pinned by digest, loopback port.
- Results (`docs/spikes/SP3-mmo.md`): 500/500 handoffs, server handoff p95 5 ms, client ack gap p95 94.5 ms, jump ≤ 0.45 m, tick p95 6.5–9 ms; bandwidth ≈ 730 kbit/s per player with 500 entities in view → interest management (J5) is required.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
