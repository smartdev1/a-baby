---
id: T-309
title: Tests: action settlement idempotency and concurrency end to end (J3-15)
status: todo
owner: backend
author_of_code:
priority: P1
size: S
---

## Context

J3 acceptance: replaying the same `requestId` 100 times in parallel yields one settlement.

Jalon : **J3** (`docs/roadmap.md`, J3-15).

## User story

As the team, I want automated proof that an action can never be paid twice so that the economy stays safe under retries.

## Acceptance criteria
- [ ] Given a zone cell with an in-memory economy, When the same `action_request` is replayed 100× concurrently, Then one action runs and one commit moves the balances.
- [ ] Given random sequences of requests, cancels, moves and ticks (property test), Then the sum of all balances is constant and no character balance is negative.

## Out of scope

- Load tests of actions (J3 CPU budget measured separately).

## Technical notes

fast-check model-based test.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
