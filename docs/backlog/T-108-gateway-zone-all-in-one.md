---
id: T-108
title: `apps/gateway` + `apps/zone` minimal, all-in-one mode, in-memory bus, one cell
status: todo
owner: backend
author_of_code:
priority: P0
size: L
---

## Context
Movement must be validated by an authoritative server from J1 (ARCHITECTURE §13).

Jalon : **J1** (`docs/roadmap.md`, J1-13). Dépend de : T-106, T-107. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want my movement validated by a local server so that the multiplayer foundation exists from day one.

## Acceptance criteria
- [ ] Given `pnpm dev:server`, Then one Node process hosts gateway + zone + services with an in-memory bus.
- [ ] Given a client connection with a session ticket, Then the zone runs a 20 Hz tick, applies inputs through `@skyline/physics`, rejects impossible moves and sends snapshots + acks.
- [ ] Given 50 headless bots (`tools/bots`), Then tick p95 ≤ 25 ms on a dev machine.
- [ ] Given `/health` and `/ready`, Then they reflect the zone state; logs and tick metrics go through `@skyline/observability`.

## Out of scope
- Several cells, NATS (J5).

## Technical notes
ARCHITECTURE §6.3, §13. All-in-one = no DB needed yet (in-memory adapters).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
