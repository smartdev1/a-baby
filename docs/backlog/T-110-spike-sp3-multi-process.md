---
id: T-110
title: Spike SP3 (start): 2 zone processes + NATS, entity handoff
status: todo
owner: backend
author_of_code:
priority: P1
size: L
---

## Context
No player cap means several processes; handoff between cells is the riskiest MMO piece.

Jalon : **J1** (`docs/roadmap.md`, J1-18). Dépend de : T-108. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As the owner, I want to know early if seamless cell handoff works so that the MMO architecture is validated.

## Acceptance criteria
- [ ] Given 2 zone processes owning adjacent cells and a NATS bus, When a bot walks across the border, Then it is handed off in < 100 ms without visible jump.
- [ ] Given 500 bots, Then a report `docs/spikes/SP3-mmo.md` gives tick p95, handoff time, bandwidth per player.

## Out of scope
- Production NATS cluster.

## Technical notes
ADR 0003. Running NATS locally in Docker needs the owner's approval.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
