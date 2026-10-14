---
id: T-314
title: Routing on the road graph: A* for cars and pedestrians
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Taxis, NPCs and the map need routes on the real road graph (24 385 edges in Yopougon).

Jalon : **J4** (`docs/roadmap.md`, J4-02).

## User story

As the taxi service, I want the shortest drivable route between two points so that rides follow real streets.

## Acceptance criteria
- [ ] Given the road graph (pipeline 08-roads), Then a pure A* returns the shortest route for cars (one-way respected) or pedestrians, with length and geometry.
- [ ] Given a route request across Yopougon, Then it answers in < 20 ms on the dev machine (measured).
- [ ] Given unreachable points, Then no route is returned.

## Out of scope

- Traffic-aware routing, ALT landmarks (only if measured slow).

## Technical notes

Pure package `@skyline/sim-transport` (routing part).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
