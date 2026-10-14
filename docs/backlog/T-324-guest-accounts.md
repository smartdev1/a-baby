---
id: T-324
title: Guest accounts: device token, recovery code, access tokens, tickets bound to the character
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P0
size: M
---

## Context

ARCHITECTURE §14.1 and §20.3: guest profiles only, a device token (≥ 128 bits) that is also the recovery code, 15-min access tokens; one character per profile; one active connection per character. Until now any client got a ticket and every session was a new character with fresh starter money (Djai farmable by reconnecting).

Jalon : **J6** (`docs/roadmap.md`, J6-02 and J6-03, without the database).

## User story

As a player, I want my character and my Djai to survive closing the browser, and to restore them on another browser with my recovery code.

## Acceptance criteria
- [x] `POST /api/v1/auth/guest` creates a profile: device token (shown once, recovery code) + access token; `POST /api/v1/auth/guest/session` opens a new access token from the device token; `GET /api/v1/me`.
- [x] Only hashes of tokens are stored; no identity data.
- [x] Session tickets require an access token (anonymous only with `SKYLINE_ANONYMOUS_TICKETS=true`, dev).
- [x] The zone uses the account as character id (wallet, starter grant once per character), also after a border handoff; a second login of the same account takes the existing session over.

## Out of scope

- PostgreSQL storage (J6-01, owner approval), refresh token rotation, permanent accounts, client screens (J6-13), limits on restoration attempts beyond the per-IP rate limit.

## Technical notes

Accounts stored in `data/runtime/guest-accounts.json` (ids, SHA-256 of device tokens, creation times) until the database. The all-in-one keeps anonymous tickets on by default so the preview client and the bots work unchanged.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `apps/services/src/modules/accounts/` (service, stores, routes, tests); tickets carry `accountId`, internal consume route returns it; config `SKYLINE_ANONYMOUS_TICKETS` (`.env.example`).
- Gateway: `TicketVerifier.consume` → `{ accountId } | null`; `ResumeRegistry` tracks one session per character; `CellJoin.characterId`.
- Zone: `join(sessionId, characterId)`, `CellHandoff.characterId`.
- **Frontend**: to play with a saved character, call `/auth/guest` once (store the device token), then `/auth/guest/session` and send the Bearer token when asking for a ticket.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
