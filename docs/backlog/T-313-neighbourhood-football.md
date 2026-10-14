---
id: T-313
title: Simplified neighbourhood football: a group action at a pitch with 2 to 10 participants
status: todo
owner: backend
author_of_code:
priority: P2
size: M
---

## Context

Football with neighbours is a social pillar of Yopougon (ARCHITECTURE §15.6, J3 demo: play against bots).

Jalon : **J3** (`docs/roadmap.md`, J3-14).

## User story

As a player, I want to join a match at the maracana with other players so that we have fun together.

## Acceptance criteria
- [ ] Given a football ground, When 2–10 players request the match action within the joining window, Then one match runs for all of them and each gets the fun and energy effects.
- [ ] Given a match below the minimum when the window closes, Then the requests are refused (`not_enough_players`) and nothing is charged.

## Out of scope

- Ball physics, scoring UI (client).

## Technical notes

Group actions in sim-actions: shared run, per-participant settlement.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
