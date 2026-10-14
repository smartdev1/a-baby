---
id: T-303
title: `@skyline/sim-actions`: conditions, effects registry, action state machine and idempotent settlement
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context

The engine runs every action file without code per action (ADR 0004, ARCHITECTURE §15.2–15.4).

Jalon : **J3** (`docs/roadmap.md`, J3-04).

## User story

As the zone server, I want a pure engine that validates, runs and settles actions so that adding an action is one JSON file.

## Acceptance criteria
- [x] Given an action and an actor state, When the request is evaluated, Then the condition registry (`need`, `money`, `time_window`, `cooldown`, `state`, `place_type`, `nearby_characters`) returns accept or the list of refusal reasons.
- [x] Given an accepted action, Then the state machine goes requested → validated → reserved → running → completed → settled, with interrupted / failed / timeout paths and the file's partial settlement.
- [x] Given effects, Then the effect registry (`need`, `buff`, `notification`, `money`, `skill_xp`, `item_add`, `item_remove`) produces state changes and economy legs (never balances); `money` legs are settled with the key `action:{requestId}`.
- [x] Given the ellipse, Then a game duration is mapped to real time capped by `duration.real.maxSeconds` while game-time effects apply in full.
- [x] Given the same `requestId` settled twice, Then the second settlement returns the first result (property test).

## Out of scope

- Economy persistence (EconomyPort in memory in J3-05), zone binding.

## Technical notes

Registries are open: a new effect type = one handler file + its schema entry.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `packages/sim-actions/src/`: views, condition and effect registries, ellipse, deterministic outcome draw, state machine, settlement + `SettlementStore` (in-memory idempotency until the EconomyPort of J3-05).
- Interrupt policy: `refund_none_partial_effects` = cost charged, continuous effects already applied are kept, no completion effect; `refund_full_no_effects` = refunded, no effect; `refund_none_no_effects` = cost charged, no effect; `failed` (server side) = refunded, no effect. Cooldowns only on completion.
- MVP price = `cost.djai.base` (price modifiers and player business price lists: J5/J6).
- Tests: 7 (conditions, midnight windows, garba end to end, sleep ellipse with 66 energy over any tick pattern, interruptions, illegal transitions, idempotency property ×1..100 replays, outcome distribution).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
