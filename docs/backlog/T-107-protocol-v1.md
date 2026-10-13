---
id: T-107
title: `@skyline/protocol` v1: hello, input, input_ack, snapshot, world_clock
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context
Client and gateway need a versioned, bounded binary protocol before any multiplayer code.

Jalon : **J1** (`docs/roadmap.md`, J1-12). Dépend de : T-004. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As the gateway, I want to decode untrusted client messages safely so that a malformed packet never crashes a server.

## Acceptance criteria
- [x] Given messages `hello`, `input` (InputIntent + seq), `input_ack`, `snapshot` (quantized positions, deltas), `world_clock`, Then each has a bounded binary codec or a MessagePack + Zod schema, and `protocolVersion` is checked at handshake.
- [x] Given 10 000 fuzzed buffers, Then decoding only throws typed errors.
- [x] Given the archived prototype contracts (`docs/archive/legacy-code/contracts-index.ts`), Then reusable ideas (Position, interact, purchase idempotency, ping) are reused, combat types are not.

## Out of scope
- Chat, actions, economy messages (J3–J6).

## Technical notes
ARCHITECTURE §14.2. Shared contract — reviewed by the frontend.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — `@skyline/protocol` v1 (pure; deps `@msgpack/msgpack`, `zod`):
  - Binary hot path: `input` (10 bytes, intent only), `input_ack` (27 bytes, authoritative position + velocity), `snapshot` (≤ 512 entities × 19 bytes), `ping` / `pong`.
  - Control via MessagePack with decode limits + Zod: `hello`, `welcome` (frame origin = cell SW corner, so positions are i32 millimetres instead of imprecise float32 UTM), `world_clock` (clock segment, ADR 0011), `error` (typed codes).
  - `checkHello` refuses another `protocolVersion` with `version_mismatch`.
  - From the archived prototype contracts: position and ping ideas reused; `interact` is an input flag; `purchase` idempotency belongs to the economy messages (J6); combat types dropped.
- Tests: 11 (fast-check round trips with quantization tolerances, 10 000-frame fuzz per direction, bounds); 100 % lines; coverage threshold added.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
