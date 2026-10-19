---
id: T-116
title: Client LOD L1 — build step + crossfade
status: todo
owner: frontend
author_of_code: (to be filled)
priority: P1
size: M
---

## Context

LOD level 1: pipeline step `lod-build` (couloir D) + client crossfade between L0 and L1. Reduces draw calls for distant tiles.

Jalon : **J1** (`docs/roadmap.md`). Dépend de : T-114.

## User story

As a player, I want distant buildings to use lower-detail models, so performance stays stable.

## Acceptance criteria

- [ ] Given distant tiles, Then L1 impostors replace L0 meshes with crossfade.
- [ ] Given LOD transition, Then no visual pop or flicker.
- [ ] Given pipeline, Then `lod-build` step produces L1 assets.

## Out of scope

- L2/L3 impostors (J2-04).
- Multi-level streaming (J2-05).

## Technical notes

Ref. roadmap §4 (J1-09). Couloir C + D.

## Implementation log

(to be filled)

## Review

(to be filled)

## QA report

(to be filled)
