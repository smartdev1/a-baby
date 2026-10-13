---
id: T-106
title: `@skyline/physics`: deterministic 2.5D character controller
status: todo
owner: backend
author_of_code:
priority: P0
size: L
---

## Context
Client prediction and server validation must run the exact same movement code against the same `collision.bin`.

Jalon : **J1** (`docs/roadmap.md`, J1-10). Dépend de : T-009. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want smooth walking that the server agrees with so that I never rubber-band.

## Acceptance criteria
- [ ] Given a capsule (radius, height), inputs and a fixed step (50 ms), Then the controller moves against height field and prisms with sliding, step-up ≤ 0.35 m and slope limit.
- [ ] Given 10 000 random moves against a real Yopougon tile, Then the character never ends inside a prism (property test).
- [ ] Given the same inputs, Then client and server produce bit-identical positions (pure package, no Math.random, no Date).

## Out of scope
- Vehicles (J4), swimming.

## Technical notes
Pure package; shared contract — reviewed by the frontend.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
