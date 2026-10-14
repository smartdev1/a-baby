---
id: T-314
title: Routing on the road graph: A* for cars and pedestrians
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

Taxis, NPCs and the map need routes on the real road graph (24 385 edges in Yopougon).

Jalon : **J4** (`docs/roadmap.md`, J4-02).

## User story

As the taxi service, I want the shortest drivable route between two points so that rides follow real streets.

## Acceptance criteria
- [x] Given the road graph (pipeline 08-roads), Then a pure A* returns the shortest route for cars (one-way respected) or pedestrians, with length and geometry.
- [x] Given a route request across Yopougon, Then it answers in < 20 ms on the dev machine (measured).
- [x] Given unreachable points, Then no route is returned.

## Out of scope

- Traffic-aware routing, ALT landmarks (only if measured slow).

## Technical notes

Pure package `@skyline/sim-transport` (routing part).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- 2026-10-14 — `packages/sim-transport/src/` (graph, components, A*); tests: one-way, unreachable, nearest node, A* = Dijkstra property on random grids.
- Measured on Yopougon (dev laptop): 200 routes between random main-network nodes (≈ 7.7 km): cars p50 1.9 ms / p95 7.6 ms / max 22.8 ms (first call, JIT), pedestrians p95 8.4 ms.
- The car network has 114 strong components (one-way ways cut at the commune boundary); the main one holds 90 % of the nodes: services should snap points with `nearestNode(..., mainOnly = true)`.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
