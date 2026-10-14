---
id: T-306
title: Economy: `EconomyPort` contract, leg rules (`economy-rules`) and an idempotent in-memory ledger
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context

Every Djai movement goes through one double-entry, idempotent commit (ARCHITECTURE §18). J3 runs actions before the database exists (J6): the zone needs an in-memory ledger behind the same port.

Jalon : **J3** (`docs/roadmap.md`, J3-05 (economy part)).

## User story

As the zone server, I want to settle actions through the EconomyPort so that money is never created, lost or paid twice.

## Acceptance criteria
- [x] Given legs, Then `economy-rules` validates them (integer Djai, ≥ 2 legs, sum = 0, known account kinds) and rejects with `INVALID_LEGS`.
- [x] Given a commit, Then the in-memory ledger applies all legs or none, refuses a character or business balance below 0 (`INSUFFICIENT_FUNDS`), and returns `txId` and the new balances.
- [x] Given the same idempotency key replayed (sequentially or 100× concurrently), Then the first result is returned with `replayed: true` and balances move once.
- [x] Given a new character, Then a starter grant is committed once (`grant:starter:{characterId}`).

## Out of scope

- PostgreSQL ledger (J6), caps per game day (J5).

## Technical notes

Amounts are `bigint` in the contract (ARCHITECTURE §18).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

- 2026-10-14 — `packages/economy-rules` (contract + leg rules, property test), `apps/zone/src/adapters/in-memory-economy.ts` (+ starter grant). Only successful results are kept for idempotency: a refused intention (insufficient funds) may succeed later with the same key.
- Starter grant amount is set by the zone config (T-308).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
