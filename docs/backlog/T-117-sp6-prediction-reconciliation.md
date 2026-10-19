---
id: T-117
title: SP6 — client prediction and server reconciliation under 150ms RTT
status: todo
owner: backend
author_of_code: (to be filled)
priority: P1
size: M
---

## Context

Spike SP6: measure reconciliation correction rate of the 2.5D character controller under 150ms RTT and 2% packet loss. Target: < 5% strong corrections.

Jalon : **J1** (`docs/roadmap.md`). Dépend de : T-106, T-108.

## User story

As a developer, I want measured proof that client prediction reconciles cleanly with server authority, so multiplayer feels responsive.

## Acceptance criteria

- [ ] Given 150ms RTT + 2% loss, Then strong corrections < 5% of ticks.
- [ ] Given measurement, Then reconciliation rate is recorded and documented.
- [ ] Given results, Then go/no-go on prediction strategy is documented.

## Out of scope

- Full MMO (J5).
- Vehicle prediction (J4).

## Technical notes

Ref. roadmap §3.1 (SP6), §4 (J1-11). Couloir S.

## Implementation log

(to be filled)

## Review

(to be filled)

## QA report

(to be filled)
