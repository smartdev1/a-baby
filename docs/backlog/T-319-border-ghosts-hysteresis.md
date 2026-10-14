---
id: T-319
title: Border ghosts and handoff hysteresis
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: L
---

## Context

Spike SP3 (risk 2): a player does not see the players of the neighbour cell near a border. ARCHITECTURE §13.4: entities within `R_ghost = 200 m` of a border are published read-only to the neighbour cells at 10 Hz; a transfer happens only 20 m past the border (hysteresis).

Jalon : **J5** (`docs/roadmap.md`, J5-03).

## User story

As a player standing near a cell border, I want to see the players on the other side, and to walk along the border without being transferred back and forth.

## Acceptance criteria
- [x] Given a player within 200 m of a border, Then the neighbour cells of the cluster receive it as a ghost and include it in their snapshot, in their own frame.
- [x] Given ghosts that stop arriving, Then they disappear after 500 ms; an entity the cell owns is never duplicated by a ghost.
- [x] Given a player crossing into a cell of the cluster, Then it is handed over only beyond 20 m past the border; into an unowned cell it is still stopped at the border.

## Out of scope

- Chat and group actions across borders (J5-12), dynamic cell directory (J5-02).

## Technical notes

Ghosts ride on the same 10 Hz as snapshots; the gateway needs nothing new (its interest sets work on the merged snapshot). Ghost positions are absolute UTM on the bus because frames differ between cells.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `apps/zone/src/handoff/cell-ghosts.ts` (`ghostTargets`, `nearBorder`, `toGhost`, `GhostBoard`) + tests; `cell-handoff.ts` `HANDOFF_HYSTERESIS_M`, `depthOutsideM`.
- `@skyline/bus`: `CellGhosts`, `GhostEntity`, `subjects.cellGhosts`.
- `ZoneCell`: subscribes to its ghosts subject, publishes ghosts with each snapshot (only to cells of `clusterCells`), merges fresh ghosts into the snapshot; handoff only beyond 20 m.
- Tests: hysteresis (handoff past 382 020 m), ghost of a west-cell player 2 m from the border seen in the east cell's snapshot at x ≈ −2.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
