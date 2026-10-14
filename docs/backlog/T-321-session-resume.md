---
id: T-321
title: Reconnection with a resume token (60 s)
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: M
---

## Context

ARCHITECTURE §13.6 (CDC §14.13): the avatar stays 60 s after a disconnection; the reconnection uses a resume token; one active connection per character, the new one closes the old. Mobile 4G in Abidjan drops sockets often.

Jalon : **J5** (`docs/roadmap.md`, J5-07, server part).

## User story

As a player on a phone, I want a short network drop not to throw me back to the spawn point with fresh needs.

## Acceptance criteria
- [x] Given a successful handshake, Then the client receives a resume token (rotated at each handshake, single use).
- [x] Given a dropped connection, When the client says `hello {resumeToken}` within 60 s, Then it gets the same session, the same entity and its player where it stood (needs and wallet re-sent).
- [x] Given no resume within 60 s, Then every cell forgets the session; the token no longer works.
- [x] Given a resume while the old connection is still open, Then the old one gets `session_replaced` and is closed without ending the session.
- [x] A kicked client (malformed or flooding) cannot resume.

## Out of scope

- Client side (exponential backoff with jitter, storing the token), resume across gateways (shared store, J5-02), "disconnected" state shown to other players.

## Technical notes

Protocol v5: `hello` carries exactly one of `ticket` / `resumeToken`; server `resumeInfo` (113); error code `session_replaced`. Only the SHA-256 of tokens is kept in memory.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `packages/protocol`: `HelloSchema` (refine: exactly one), `ResumeInfoSchema`, `session_replaced`, `PROTOCOL_VERSION = 5`, tests.
- `apps/gateway/src/session/resume-registry.ts`; `client-session.ts`: suspend on drop, terminate on kick, replace on newer connection, `play()` shared by fresh and resumed handshakes, token issued in `resumeInfo`; registry created per gateway in `ws-gateway.ts`.
- `apps/zone`: a `cell.<key>.join` for a session already in the cell re-welcomes it without resetting (`DailyLife.resync` re-sends needs and wallet).
- **Frontend**: protocol v5 — the client must send `hello` with `ticket` (unchanged) and may store `resumeInfo.resumeToken` to reconnect.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
