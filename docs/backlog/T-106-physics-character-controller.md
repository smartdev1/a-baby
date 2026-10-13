---
id: T-106
title: `@skyline/physics`: deterministic 2.5D character controller
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context
Client prediction and server validation must run the exact same movement code against the same `collision.bin`.

Jalon : **J1** (`docs/roadmap.md`, J1-10). Dépend de : T-009. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As a player, I want smooth walking that the server agrees with so that I never rubber-band.

## Acceptance criteria
- [x] Given a capsule (radius, height), inputs and a fixed step (50 ms), Then the controller moves against height field and prisms with sliding, step-up ≤ 0.35 m and slope limit.
- [x] Given 10 000 random moves against a real Yopougon tile, Then the character never ends inside a prism (property test).
- [x] Given the same inputs, Then client and server produce bit-identical positions (pure package, no Math.random, no Date).

## Out of scope
- Vehicles (J4), swimming.

## Technical notes
Pure package; shared contract — reviewed by the frontend.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — `@skyline/physics` (pure, depends on `@skyline/tile-format` types):
  - `CollisionWorld` (tiles in the protocol frame, bilinear ground, prisms in a 16 m grid), `stepCharacter` (50 ms fixed step, capsule 0.30 × 1.75 m, sub-steps ≤ 15 cm, push-out sliding, step-up 0.35 m, 45° slope limit, jump, gravity, grounding).
  - Determinism: pure functions, no random, no clock. Note: bit-identical within the same JS engine; `Math.sin/cos` may differ in the last bit across engines (V8 server vs Firefox client) → handled by reconciliation (SP6).
- Tests: 7 unit/property tests (walk speed, wall stop, sliding, kerb vs wall, jump/land, determinism, 10 000 random moves in a dense city) + integration test `tools/map-pipeline/src/stages/physics-on-fixture.test.ts`: 10 000 steps through the real Pigeons collision tiles, never inside a building. Coverage threshold 85 % lines added.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
