---
id: T-109
title: `@skyline/sim-clock` + `world-clock` module: internal world clock, ratio, calendar
status: todo
owner: backend
author_of_code:
priority: P0
size: M
---

## Context
Owner decision: the game has its own clock (ADR 0011). Day/night, opening hours, rents all depend on it.

Jalon : **J1** (`docs/roadmap.md`, J1-14 (server side)). Dépend de : T-004. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want the same game time as everyone else so that shops open and night falls for all.

## Acceptance criteria
- [ ] Given `content/game-config/clock.json` (ratio, default 1 game day = 2 real hours) and `calendar.json`, Then `sim-clock` converts real time ↔ game time through clock segments (ratio changes and pauses keep continuity).
- [ ] Given the services module `world-clock`, Then the current segment is persisted and published; the zone sends `world_clock` to clients.
- [ ] Given a client drift correction test, Then the displayed game time stays within 1 game minute of the server.
- [ ] Given rules, Then no game rule uses `Date.now()` (lint rule or test).

## Out of scope
- Offline rules for needs and rents (J3/J6).

## Technical notes
ADR 0011. Client day/night rendering by the frontend.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
