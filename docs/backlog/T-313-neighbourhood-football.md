---
id: T-313
title: Simplified neighbourhood football: a group action at a pitch with 2 to 10 participants
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P2
size: M
---

## Context

Football with neighbours is a social pillar of Yopougon (ARCHITECTURE §15.6, J3 demo: play against bots).

Jalon : **J3** (`docs/roadmap.md`, J3-14).

## User story

As a player, I want to join a match at the maracana with other players so that we have fun together.

## Acceptance criteria
- [x] Given a football ground, When 2–10 players request the match action within the joining window, Then one match runs for all of them and each gets the fun and energy effects.
- [x] Given a match below the minimum when the window closes, Then the requests are refused (`not_enough_players`) and nothing is charged.

## Out of scope

- Ball physics, scoring UI (client).

## Technical notes

Group actions in sim-actions: shared run, per-participant settlement.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- 2026-10-14 — `apps/zone/src/actions/group-lobby.ts` + `DailyLife`: a group action is `accepted` while waiting (site reserved), started for every member by the 1 Hz tick when the lobby is full or its 60 s joining window ends with ≥ `participants.min`; refused (`not_enough_players`) otherwise; cancel / walk-away / leaving removes the member and frees the site, nothing settled. Each member is then run and settled individually (own effects, own idempotency key).
- `sport.play_football`: group of 2–10, interaction radius 40 m around the pitch.
- Bots on the pitch (J3 demo) are client / bot-tool work: they join with the same `action_request`.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
