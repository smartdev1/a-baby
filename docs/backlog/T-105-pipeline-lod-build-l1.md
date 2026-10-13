---
id: T-105
title: Pipeline stage `lod-build`: L1 tiles (500 m) with simplified buildings and merged roads
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

The client needs a coarser level beyond ~300 m to keep FPS on modest PCs.

Jalon : **J1** (`docs/roadmap.md`, J1-09 (pipeline side)). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As the client, I want L1 tiles so that distant Yopougon stays visible at low cost.

## Acceptance criteria
- [x] Given four L0 tiles, Then one L1 tile holds merged, simplified building volumes and roads (meshopt simplify), within its budget.
- [x] Given the manifest, Then it lists L1 keys and hashes (split per level when > 1 MB).

## Out of scope

- L2/L3 impostors (J2).

## Technical notes

ARCHITECTURE §10.2. Client side by the frontend (J1-09).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — Stage `15-lod-build` + `src/lod/`: L1 (500 m) render tiles from their 4 L0 children — buildings < 30 m² dropped, footprints simplified with Douglas–Peucker (1.5 m), paths dropped, terrain on a 10 m grid, water by majority of child cells; L0 tiles streamed two rows at a time; budgets enforced.
- Footprint simplification was preferred to meshopt simplify: it keeps buildings as clean extrusions and is deterministic.
- Manifest: L1 entries carry `geom` only (schema now requires collision + meta for L0, geom for LOD levels).
- Yopougon: 1 213 L1 tiles, 40 MB, avg 34 KB, max 137 KB / 15 713 triangles; 15 s.
- Tests: L1 builder + ring simplification, manifest LOD rules; golden covers `lod-index.json`.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
