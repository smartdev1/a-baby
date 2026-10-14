---
id: T-302
title: `@skyline/sim-needs`: needs decay per game hour, penalties, frozen while offline
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context

Hunger, energy, hygiene, social and fun drive the daily life loop (ARCHITECTURE §16.2).

Jalon : **J3** (`docs/roadmap.md`, J3-03).

## User story

As a player, I want my needs to evolve with game time so that eating, washing and sleeping matter.

## Acceptance criteria
- [x] Given `content/needs/needs.config.json` (rates per game hour, thresholds), When game time passes while connected, Then needs decay linearly, clamped to 0..100, identically on any machine (pure functions of game minutes).
- [x] Given a need at 0, Then its penalties are reported (slower walk, work actions refused); morale is derived, not stored.
- [x] Given a disconnection, Then needs are frozen (no decay for offline game time).
- [x] Given the default config, Then one game day asks for about two meals, one wash and one night of sleep (property test).

## Out of scope

- Death, illness.

## Technical notes

Uses `@skyline/sim-clock` game minutes only (never real time).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `needs-state.ts`, `needs-effects.ts`; property test: decay in many steps = one step.
- Calibration of `content/needs/needs.config.json` over one game day (24 h): hunger 4.5/h → 108 points = two meals of +55; energy 5/h over 16 h awake = 80 points ≈ 8 h of sleep at +11/h; hygiene 2.5/h → 60 points < one wash (+70). The automated check on the real file comes with content-cli (T-304).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
