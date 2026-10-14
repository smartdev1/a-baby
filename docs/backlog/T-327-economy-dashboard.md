---
id: T-327
title: Economy dashboard: money supply, sources and sinks
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P2
size: S
---

## Context

J6-16: watch the money supply, the sources (wages, starter grants) and the sinks (shops, transport, fees) to tune the economy and spot farming.

Jalon : **J6** (`docs/roadmap.md`, J6-16, on the interim ledger).

## User story

As the owner balancing the game, I want to see how much Djai exists and where it comes from and goes.

## Acceptance criteria
- [x] `ledgerSummary` (economy-rules): money supply (characters + businesses), escrow, sources (negative system balances), sinks (positive ones).
- [x] All-in-one: `GET /api/v1/dev/economy`; zone process: `GET /economy` on the loopback stats port.

## Out of scope

- Grafana dashboards (J5-11), history over time.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `packages/economy-rules/src/ledger-summary.ts` (+ test); `InMemoryEconomy.summary()`, `JournaledEconomy.summary()`; stats server takes a route table.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
