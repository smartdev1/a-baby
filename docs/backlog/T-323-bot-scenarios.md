---
id: T-323
title: Bot scenarios (market crowd, social: chat and taxis) and chat fan-out cap
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P2
size: M
---

## Context

J5-10: `tools/bots` scenarios beyond the random walk and the border crossing, to load the new features (interest sets in a crowd, proximity chat, taxis).

Jalon : **J5** (`docs/roadmap.md`, J5-10).

## User story

As the QA of the MMO, I want reproducible crowd and social scenarios so that bandwidth, chat fan-out and transport hold under load.

## Acceptance criteria
- [x] `--walk market`: bots converge on one point and mill around it.
- [x] `--walk social`: random walk, a chat line every 5 s (seeded offsets), one taxi request towards `--place`.
- [x] The summary reports entities per snapshot, chat lines sent and deliveries per line, chat refusals and taxi states.

## Out of scope

- Action scenarios (eating, working), Grafana dashboards (J5-11).

## Technical notes

Finding: in a 300-bot crowd an uncapped chat line reached ≈ 290 players (≈ 17 000 messages/s). Proximity chat now goes to at most the 64 nearest listeners (as the full-rate interest set).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `tools/bots/src/bot-scenarios.ts` (+ tests); `bot-client.ts` counts messages per type, entities seen, chat sent, last taxi state; `cli.ts` `--walk market|social`, `--place`.
- `apps/zone`: `ChatPlayers.sessionsWithin(…, limit)` nearest first; `CHAT_MAX_LISTENERS = 64`.
- Measures (300 bots, 25 s): market 199 kbit/s per bot, 128 entities per snapshot, tick p95 15.8 ms; social 204 kbit/s, 63.6 deliveries per chat line, tick p95 20.2 ms.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
