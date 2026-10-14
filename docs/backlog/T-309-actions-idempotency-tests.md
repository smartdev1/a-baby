---
id: T-309
title: Tests: action settlement idempotency and concurrency end to end (J3-15)
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: S
---

## Context

J3 acceptance: replaying the same `requestId` 100 times in parallel yields one settlement.

Jalon : **J3** (`docs/roadmap.md`, J3-15).

## User story

As the team, I want automated proof that an action can never be paid twice so that the economy stays safe under retries.

## Acceptance criteria
- [x] Given a zone cell with an in-memory economy, When the same `action_request` is replayed 100× concurrently, Then one action runs and one commit moves the balances.
- [x] Given random sequences of requests, cancels, moves and ticks (property test), Then the sum of all balances is constant and no character balance is negative.

## Out of scope

- Load tests of actions (J3 CPU budget measured separately).

## Technical notes

fast-check model-based test.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

- 2026-10-14 — `apps/zone/src/actions/daily-life.property.test.ts`: 100 concurrent replays (before and after completion) → one commit; model-based property (150 runs, 3 players, requests with repeated ids, cancels, moves, ticks with game time): ledger total 0, no negative player balance, at most one commit per (player, request id).
- **Security fix found while writing the tests**: idempotency keys were global (`action:{requestId}`); a second player reusing a request id got the first player's settlement replayed (effects without paying) and a site without a free slot. Keys are now scoped per character (`action:{characterId}:{requestId}`), with per-player settlements and reservations; regression test added.
- **Owner**: ARCHITECTURE §18 lists `action:{requestId}`; please amend it to the character-scoped key (owner-only file).
- `DailyLife` takes an injectable real clock (`realNow`) so tests drive complete runs.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
