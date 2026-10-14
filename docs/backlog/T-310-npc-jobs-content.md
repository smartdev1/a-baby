---
id: T-310
title: Five NPC jobs and their work actions (wave A)
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

Players earn Djai by working for NPC employers (ARCHITECTURE §16.3).

Jalon : **J3** (`docs/roadmap.md`, J3-10 / J3-13 (jobs part)).

## User story

As a player, I want to work a shift as a maquis waiter or attiéké seller and get paid by the system so that I can afford food and rent.

## Acceptance criteria
- [x] Given `content/jobs`, Then 5 jobs exist (maquis waiter, attiéké seller, hairdresser, cybercafe manager, kiosk keeper) with day and night shifts, wages and an anti-farm cap.
- [x] Given a work action, Then completing a shift pays the wage from `system:wages` through the EconomyPort and costs energy.
- [x] Given content-cli, Then jobs and work actions validate with their cross references.

## Out of scope

- Player employers (J5/J6).

## Technical notes

Wage paid by the work action's `money` effect (actor_earns from system:wages).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

- 2026-10-14 — `content/jobs/` (maquis waiter 3 000 Dj, attiéké seller 2 500, hairdresser 3 500, cybercafe manager 3 000, kiosk keeper 2 500; day and night shifts; levels 1–3) and `content/actions/work/` (shift = one action, 6–8 game hours capped at 10 real minutes, wage from `system:wages`, energy −20/−25, social +10, skill XP, 24 game-hour cooldown = one paid shift per game day, nothing paid if the player leaves). Employer place types gain a `staff_post` site.
- Test: a full night shift at a maquis pays 3 000 Djai from `system:wages`, costs energy and blocks a second shift the same game day.
- Level wage bonuses and job applications (choosing an employer) come with the job UI (J3-07/J3-08) and the employment module (J5).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
