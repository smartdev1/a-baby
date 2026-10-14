---
id: T-326
title: Journaled ledger: balances survive restarts until PostgreSQL
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: S
---

## Context

With guest accounts (T-324) and saved characters (T-325), the wallet was the only state lost at restart; worse, the starter grant was paid again because its idempotency key was forgotten. ARCHITECTURE §13.5: money is written before it is shown.

Jalon : **J6** (interim before `economy`, J6-05, which needs the database schema).

## User story

As a player, I want my Djai to be still there after the server restarts.

## Acceptance criteria
- [x] Each successful commit is appended to a journal before its result is returned; refused commits are not.
- [x] At start-up the journal is replayed: balances and idempotency keys come back (the starter grant is not paid twice).
- [x] A truncated last line (crash mid-append) is skipped and closed; later entries stay readable.

## Out of scope

- The PostgreSQL ledger, ordered locks, caps and stock operations (J6-05, J6-06); sharing balances between zone processes.

## Technical notes

`data/runtime/ledger.ndjson` (all-in-one) or `ledger.<cells>.ndjson` (zone process). Amounts as decimal strings (bigint). Replay cost grows with the journal: fine for development, replaced by the database later.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `apps/zone/src/adapters/journaled-economy.ts` (+ test); wired in the zone process and the all-in-one.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
