---
id: T-310
title: Five NPC jobs and their work actions (wave A)
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Players earn Djai by working for NPC employers (ARCHITECTURE §16.3).

Jalon : **J3** (`docs/roadmap.md`, J3-10 / J3-13 (jobs part)).

## User story

As a player, I want to work a shift as a maquis waiter or attiéké seller and get paid by the system so that I can afford food and rent.

## Acceptance criteria
- [ ] Given `content/jobs`, Then 5 jobs exist (maquis waiter, attiéké seller, hairdresser, cybercafe manager, kiosk keeper) with day and night shifts, wages and an anti-farm cap.
- [ ] Given a work action, Then completing a shift pays the wage from `system:wages` through the EconomyPort and costs energy.
- [ ] Given content-cli, Then jobs and work actions validate with their cross references.

## Out of scope

- Player employers (J5/J6).

## Technical notes

Wage paid by the work action's `money` effect (actor_earns from system:wages).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
