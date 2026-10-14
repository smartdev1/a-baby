---
id: T-308
title: Zone: actions bound to the world — places and sites of the cell, site reservations, needs at 1 Hz, settlement through the EconomyPort
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context

The pure engine (T-303) needs the authoritative state of the cell: player needs and wallets, the places and sites of the cell (tile meta), reservations, game time.

Jalon : **J3** (`docs/roadmap.md`, J3-05).

## User story

As a player, I want to eat a garba at a real stand of Yopougon and see my hunger and Djai change, so that daily life works end to end.

## Acceptance criteria
- [x] Given the cell's tiles, Then its typed places and sites are loaded (meta.json) and a player request is evaluated with `sim-actions` against the player's needs, wallet, states and the place.
- [x] Given an accepted request, Then the site capacity is reserved, the action runs at 1 Hz with the ellipse, continuous effects apply, and the settlement is committed through the EconomyPort with `action:{requestId}`.
- [x] Given needs, Then they decay with game time while connected and are sent at most 1 Hz when they change; the wallet is sent after each commit.
- [x] Given the player walks away from the site, cancels or disconnects, Then the action is interrupted and settled as its file says, and the site is released.

## Out of scope

- NPC behaviour (J3-10), interiors (J3-12).

## Technical notes

Content packs compiled by content-cli are loaded at start.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

- 2026-10-14 — `apps/zone/src/actions/` (content, setup, `DailyLife`, player life, site reservations), `world-data/cell-places-loader.ts`; `ZoneCell` option `daily`; bus subject `cell.<key>.action` (`CellAction`), `CellHandoff.needs`; gateway forwards `action_request` / `action_cancel`; all-in-one and standalone zone compose daily life (`SKYLINE_STARTER_DJAI`, default 5 000; zone `SKYLINE_CONTENT_DIR`).
- Content loaded directly from `content/` with the schemas (compiled packs from content-cli can replace it later without changing `DailyLife`).
- Tests: DailyLife with the real content files (garba end to end, replays charged once, walk-away, night, busy, full site); all-in-one e2e (starter Djai, needs, refused request).
- Known J3 limits: guest character id = session id (no persistence before J6); in-memory ledger per zone process; the game minute comes from the cached world clock segment.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
