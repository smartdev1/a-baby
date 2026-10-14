---
id: T-317
title: Interest management: spatial hash, caps 64/128, differentiated rates
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P0
size: L
---

## Context

Spike SP3: with 500 players in a cell every client receives the 500 entities at 10 Hz (≈ 730 kbit/s per player). ARCHITECTURE §13.3: 32 m spatial hash, radius 150 m on foot, 64 entities at full rate, 128 at reduced rate, the rest not sent.

Jalon : **J5** (`docs/roadmap.md`, J5-04).

## User story

As a player on a 4G phone in Abidjan, I want to receive only the players around me so that the game stays playable in a crowd.

## Acceptance criteria
- [x] Given a cell snapshot, Then each client receives only the entities within 150 m of its player, nearest first, without its own entity.
- [x] Given a crowd, Then at most 64 entities ride on every snapshot and 128 more on every other snapshot.
- [x] The bus still carries one snapshot per cell (no O(N²) traffic, SP3).

## Out of scope

- Ghosts across cell borders (J5-03), delta replication and quantisation (J5-05), priorities other than distance, vehicle radius.

## Technical notes

Computed in the gateway fan-out rather than in the zone (ARCHITECTURE §13.2 step 8): the zone keeps publishing one snapshot per cell, each gateway indexes it once and composes the frames of its own sessions. **Owner decision needed** to confirm this placement (or update §13.2 / §13.3).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `apps/gateway/src/interest/` (`spatial-hash.ts`, `interest-selection.ts`, tests); `routing/cell-fanout.ts` now composes a frame per session from its player's entity (`Viewer.entityId`, learnt from the cell `welcome`); a session absent from the snapshot gets nothing until it appears.
- Reduced rate = every other snapshot (5 Hz with snapshots at 10 Hz); the client already drops an entity after 1 s without update, so no protocol change.
- Viewers of the same 32 m mesh share one interest set (anchored on the mesh centre) and one encoded frame: a first version with one set and one frame per session pushed the all-in-one tick p95 to 88 ms (gateway and zone share the event loop there).
- `CellFanout.entitiesPerFrame()` for bandwidth monitoring.
- Measured (500 bots, random walk in one cell, all-in-one, same machine as SP3), without → with interest: down **753 → 199 kbit/s per bot**, acks 19.9 → 20.0 per bot per s, tick p95 34.7 → 28.4 ms. Remaining bytes: 64–192 entities × 19 B; quantisation and deltas (J5-05) are the next step.
- Note: the zone tick p95 without interest (34.7 ms at 500 players) is far above SP3 (6.5–9 ms) since daily life (T-308 onwards) runs in the tick; to profile before the J5 load tests.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
