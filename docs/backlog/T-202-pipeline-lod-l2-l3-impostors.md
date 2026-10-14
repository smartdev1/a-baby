---
id: T-202
title: Pipeline stage `lod-build`: L2 and L3 tiles (1 km, 2 km) with building block impostors
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: L
---

## Context

L1 (500 m) covers about 4.5 km around the player. The horizon of a 1:1 commune needs coarser levels: J2 asks for L2/L3 and building impostors.

Jalon : **J2** (`docs/roadmap.md`, J2-04).

## User story

As the client, I want L2/L3 tiles so that the whole commune is visible to the horizon within the draw-call and memory budgets.

## Acceptance criteria
- [x] Given L1 tiles, When `lod-build` runs, Then L2 (1 km) and L3 (2 km) render tiles are built: terrain at a coarser resolution, water, major roads only, buildings merged into simplified block volumes (impostor boxes per city block / height class).
- [x] Given the manifest, Then it lists L2 and L3 keys and hashes.
- [x] Given the budgets, Then each L2/L3 tile stays within §10.4 (triangles and size) and the build fails otherwise.

## Out of scope

- Octahedral vegetation impostors (frontend, J2-07).

## Technical notes

Same render-only format as L1 (`geom.glb`). Frame: tile south-west corner, x = east, z = north once loaded (glTF x = −east).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `lod/build-coarse-tile.ts` + `lod/block-impostors.ts`; `15-lod-build` v3 builds L1, L2 and L3 from the L0 lines (bands of 2ⁿ rows, worker pool); new job kind `coarse`; `TileBuildingPart.id` accepts `block:<n>`.
- Yopougon: 1 213 L1 (44.7 MB, max 159 KB, 16.7 k triangles), 344 L2 (16.3 MB, max 236 KB, 25.1 k triangles), 102 L3 (4.8 MB, max 227 KB, 25.0 k triangles); the manifest lists them all; stage 14 s.
- Preview: `docs/previews/j2-yopougon-overview-l3.jpg` (whole commune from L3 only).
- Client side (frontend): stream L2/L3 beyond L1 (J2-05).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
