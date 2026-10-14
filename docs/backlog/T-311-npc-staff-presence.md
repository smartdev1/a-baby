---
id: T-311
title: Functional NPC staff: deterministic presence by place type and opening hours, required roles enforced
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: S
---

## Context

Actions such as eating a garba need the vendor (ARCHITECTURE §15.3 `participants.npcRoles`). NPC staff must be consistent between the server (rules) and the client (display).

Jalon : **J3** (`docs/roadmap.md`, J3-10).

## User story

As a player, I want the vendor, the waiter and the hairdresser to be there when the place is open so that the world feels inhabited and actions make sense.

## Acceptance criteria
- [x] Given a place type with `npcRoles` and opening hours, Then its NPC staff are on duty exactly during the opening hours (deterministic, no network traffic).
- [x] Given an action with a required NPC role, When no NPC of that role is on duty, Then the request is refused with `no_npc` and the role.
- [x] Given the client, Then it can derive the same staff from the tile meta (place type) and the content catalogue.

## Out of scope

- NPC routines, dialogues (frontend content), player employees replacing NPCs (J6).

## Technical notes

Avoids replicating hundreds of static NPCs at 10 Hz per player.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- 2026-10-14 — `sim-actions`: `PlaceView.npcRolesOnDuty` + condition `no_npc` (required `participants.npcRoles`); zone: roles of the place type on duty during its opening hours (game time).
- Decision: NPC staff are **not replicated** in snapshots (hundreds of static NPCs per cell at 10 Hz would cost tens of KB/s per player); the client derives the same staff from the tile meta (`placeType`) and the content catalogue (`npcRoles`, `openingHours`) — **frontend**: display them at the place's `staff_post` / first site.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
