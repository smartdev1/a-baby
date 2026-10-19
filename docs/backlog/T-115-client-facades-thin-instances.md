---
id: T-115
title: Client facades — thin instances + material plugin (tint, dirt, array index)
status: todo
owner: frontend
author_of_code: (to be filled)
priority: P1
size: L
---

## Context

Render building facades using thin instances with a material plugin for per-instance tint, dirt, and array-index variation. Consumes the facade kit (T-113) and facades-roofs pipeline output (T-102).

Jalon : **J1** (`docs/roadmap.md`). Dépend de : T-102, T-113.

## User story

As a player, I want buildings to display varied facades, so the neighbourhood looks credible.

## Acceptance criteria

- [ ] Given a tile with facades, Then buildings render via thin instances.
- [ ] Given the material plugin, Then tint, dirt and array index vary per instance.
- [ ] Given performance, Then facade rendering holds within frame budget.

## Out of scope

- LOD L1 fade (J1-09).
- Final art kit (J2-08).

## Technical notes

Ref. roadmap §4 (J1-08). Couloir C.

## Implementation log

(to be filled)

## Review

(to be filled)

## QA report

(to be filled)
