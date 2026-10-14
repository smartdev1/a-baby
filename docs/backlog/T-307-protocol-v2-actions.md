---
id: T-307
title: Protocol v2: action request / cancel and action, needs and wallet updates
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context

Players must request actions and see their progress, needs and balance (ARCHITECTURE §14.2).

Jalon : **J3** (`docs/roadmap.md`, J3-05 (network part)).

## User story

As a player, I want to ask for an action and see it accepted, running, finished or refused with reasons, and my needs and Djai update.

## Acceptance criteria
- [x] Given the client, Then it can send `action_request {requestId, actionId, placeId}` and `action_cancel {requestId}` (MessagePack + Zod, bounded strings).
- [x] Given the server, Then it can send `action_update {requestId, actionId, state, progress, refusals}`, `needs_update {values}` and `wallet_update {djai, txId}`.
- [x] Given the new message types, Then `PROTOCOL_VERSION` is 2 and round-trip and fuzz tests cover them.

## Out of scope

- Inventory, transport, chat messages.

## Technical notes

Incompatible change: version bump checked at handshake.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

- 2026-10-14 — `messages/action-schemas.ts`, type codes 4/5 (client) and 107/108/109 (server), `PROTOCOL_VERSION = 2`; hello senders (bots, e2e, tests) use `PROTOCOL_VERSION`.
- **Frontend**: the web client must send `protocolVersion: 2` (it imports `PROTOCOL_VERSION`, so a rebuild is enough) and may now handle the three updates.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
