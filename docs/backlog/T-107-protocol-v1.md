---
id: T-107
title: `@skyline/protocol` v1: hello, input, input_ack, snapshot, world_clock
status: todo
owner: backend
author_of_code:
priority: P0
size: M
---

## Context
Client and gateway need a versioned, bounded binary protocol before any multiplayer code.

Jalon : **J1** (`docs/roadmap.md`, J1-12). Dépend de : T-004. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As the gateway, I want to decode untrusted client messages safely so that a malformed packet never crashes a server.

## Acceptance criteria
- [ ] Given messages `hello`, `input` (InputIntent + seq), `input_ack`, `snapshot` (quantized positions, deltas), `world_clock`, Then each has a bounded binary codec or a MessagePack + Zod schema, and `protocolVersion` is checked at handshake.
- [ ] Given 10 000 fuzzed buffers, Then decoding only throws typed errors.
- [ ] Given the archived prototype contracts (`docs/archive/legacy-code/contracts-index.ts`), Then reusable ideas (Position, interact, purchase idempotency, ping) are reused, combat types are not.

## Out of scope
- Chat, actions, economy messages (J3–J6).

## Technical notes
ARCHITECTURE §14.2. Shared contract — reviewed by the frontend.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
