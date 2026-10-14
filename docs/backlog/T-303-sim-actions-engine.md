---
id: T-303
title: `@skyline/sim-actions`: conditions, effects registry, action state machine and idempotent settlement
status: todo
owner: backend
author_of_code:
priority: P0
size: L
---

## Context

The engine runs every action file without code per action (ADR 0004, ARCHITECTURE §15.2–15.4).

Jalon : **J3** (`docs/roadmap.md`, J3-04).

## User story

As the zone server, I want a pure engine that validates, runs and settles actions so that adding an action is one JSON file.

## Acceptance criteria
- [ ] Given an action and an actor state, When the request is evaluated, Then the condition registry (`need`, `money`, `time_window`, `cooldown`, `state`, `place_type`, `nearby_characters`) returns accept or the list of refusal reasons.
- [ ] Given an accepted action, Then the state machine goes requested → validated → reserved → running → completed → settled, with interrupted / failed / timeout paths and the file's partial settlement.
- [ ] Given effects, Then the effect registry (`need`, `buff`, `notification`, `money`, `skill_xp`, `item_add`, `item_remove`) produces state changes and economy legs (never balances); `money` legs are settled with the key `action:{requestId}`.
- [ ] Given the ellipse, Then a game duration is mapped to real time capped by `duration.real.maxSeconds` while game-time effects apply in full.
- [ ] Given the same `requestId` settled twice, Then the second settlement returns the first result (property test).

## Out of scope

- Economy persistence (EconomyPort in memory in J3-05), zone binding.

## Technical notes

Registries are open: a new effect type = one handler file + its schema entry.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
