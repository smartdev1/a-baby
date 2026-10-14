---
id: T-318
title: Proximity chat: filter (French + nouchi), phone and link masking, block, report, rate limit
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: M
---

## Context

ARCHITECTURE §14.2 (`chat`: proximity only, 30 m, ≤ 200 characters, 1 message/s, burst of 5) and §20.2 (word filter, masking of phone numbers and links, report, mute, block; excerpts kept only when reported).

Jalon : **J5** (`docs/roadmap.md`, J5-08).

## User story

As a player, I want to talk with the people around me without receiving insults, phone numbers or scam links, and to block or report someone.

## Acceptance criteria
- [x] Given a chat message, Then the players within 30 m (and the sender) receive it filtered: blocked words, phone numbers and links masked.
- [x] Given more than 5 messages at once or more than 1 per second, Then the extra ones are refused (`rate_limited`).
- [x] Given a block, Then neither player receives the other's messages, also after a border handoff.
- [x] Given a report, Then the moderation queue receives the reported player's messages heard by the reporter in the last 5 minutes, and nothing else; chat text is never logged.

## Out of scope

- Chat across cell borders (ghosts, J5-03), moderation tools and sanctions (J7-04), client UI (frontend), persistence of blocks (characters service).

## Technical notes

Protocol v3: client `chatSend` (6), `chatBlock` (7), `chatReport` (8); server `chatMessage` (110), `chatRejected` (111). The gateway forwards to `cell.<key>.chat`.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `packages/protocol/src/messages/chat-schemas.ts` (+ tests), `PROTOCOL_VERSION = 3`; `@skyline/bus` `CellChat`, `subjects.cellChat`, `CellHandoff.chatBlocked`.
- `apps/zone/src/chat/` (filter, token bucket, proximity chat, word list loader, tests), `ports/chat-report-port.ts`, `adapters/in-memory-chat-reports.ts`; wired in the zone process and the all-in-one.
- `content/moderation/chat-words.json`: a first French list; **the nouchi list is empty and must be written by moderation or the owner** (I do not want to guess it).
- **Frontend**: protocol v3 is required (the client must send `protocolVersion: 3` and may ignore the chat messages until the chat UI exists).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
