---
id: T-109
title: `@skyline/sim-clock` + `world-clock` module: internal world clock, ratio, calendar
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context

Owner decision: the game has its own clock (ADR 0011). Day/night, opening hours, rents all depend on it.

Jalon : **J1** (`docs/roadmap.md`, J1-14 (server side)). Dépend de : T-004. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As a player, I want the same game time as everyone else so that shops open and night falls for all.

## Acceptance criteria

- [x] Given `content/game-config/clock.json` (ratio, default 1 game day = 2 real hours) and `calendar.json`, Then `sim-clock` converts real time ↔ game time through clock segments (ratio changes and pauses keep continuity).
- [x] Given the services module `world-clock`, Then the current segment is persisted and published; the zone sends `world_clock` to clients.
- [x] Given a client drift correction test, Then the displayed game time stays within 1 game minute of the server.
- [x] Given rules, Then no game rule uses `Date.now()` (lint rule or test).

## Out of scope

- Offline rules for needs and rents (J3/J6).

## Technical notes

ADR 0011. Client day/night rendering by the frontend.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

- 2026-10-13 — `@skyline/sim-clock` (pure): clock segments with continuous ratio changes / pauses, game calendar, overnight opening windows, client offset estimation (fastest third of ping/pong samples, median), Zod schemas of `content/game-config/clock.json` (ratio 12, start at 06:00) and `calendar.json`.
- Services module `world-clock`: `WorldClockService` + `ClockSegmentStore` port, in-memory and atomic file stores (`data/runtime/world-clock.json`, git-ignored, until J6), `GET /api/v1/world-clock` (`{ segment, serverTimeMs }`); wired in `apps/services` main (content and runtime folders configurable by env).
- The zone sends the `world_clock` protocol message (T-107 schema) once it exists (T-108).
- ESLint: `Date.now()` and `new Date()` forbidden in `sim-*`, `economy-rules`, `business-rules`.
- Tests: 7 (sim-clock) + 3 (module, incl. restart persistence and HTTP); drift estimate within 20 ms on jittery samples (1 game minute = 5 s real).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
