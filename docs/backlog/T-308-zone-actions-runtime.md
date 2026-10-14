---
id: T-308
title: Zone: actions bound to the world — places and sites of the cell, site reservations, needs at 1 Hz, settlement through the EconomyPort
status: todo
owner: backend
author_of_code:
priority: P0
size: L
---

## Context

The pure engine (T-303) needs the authoritative state of the cell: player needs and wallets, the places and sites of the cell (tile meta), reservations, game time.

Jalon : **J3** (`docs/roadmap.md`, J3-05).

## User story

As a player, I want to eat a garba at a real stand of Yopougon and see my hunger and Djai change, so that daily life works end to end.

## Acceptance criteria
- [ ] Given the cell's tiles, Then its typed places and sites are loaded (meta.json) and a player request is evaluated with `sim-actions` against the player's needs, wallet, states and the place.
- [ ] Given an accepted request, Then the site capacity is reserved, the action runs at 1 Hz with the ellipse, continuous effects apply, and the settlement is committed through the EconomyPort with `action:{requestId}`.
- [ ] Given needs, Then they decay with game time while connected and are sent at most 1 Hz when they change; the wallet is sent after each commit.
- [ ] Given the player walks away from the site, cancels or disconnects, Then the action is interrupted and settled as its file says, and the site is released.

## Out of scope

- NPC behaviour (J3-10), interiors (J3-12).

## Technical notes

Content packs compiled by content-cli are loaded at start.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §14, §15, §16, §18.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
