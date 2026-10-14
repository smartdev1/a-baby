---
id: T-315
title: Pipeline stage `transit`: bus, gbaka and woro-woro lines from OSM route relations
status: todo
owner: backend
author_of_code:
priority: P2
size: M
---

## Context

Public transport lines exist in OSM as route relations (spike SP2 counted them). J4 needs them as game lines (stops, path, mode).

Jalon : **J4** (`docs/roadmap.md`, J4-03).

## User story

As a player, I want real lines of Yopougon (SOTRA bus, gbaka, woro-woro) so that I can travel like the inhabitants.

## Acceptance criteria
- [ ] Given the OSM extract, When `transit` runs, Then route relations become lines with mode, name/ref, ordered stops and a path snapped to the road graph.
- [ ] Given lines without stops or broken paths, Then they are reported and skipped.

## Out of scope

- Timetables and vehicles (J4-01).

## Technical notes

Owner review of modes and line names (woro-woro corridors are rarely mapped).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
