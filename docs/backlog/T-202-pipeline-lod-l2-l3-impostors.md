---
id: T-202
title: Pipeline stage `lod-build`: L2 and L3 tiles (1 km, 2 km) with building block impostors
status: todo
owner: backend
author_of_code:
priority: P1
size: L
---

## Context

L1 (500 m) covers about 4.5 km around the player. The horizon of a 1:1 commune needs coarser levels: J2 asks for L2/L3 and building impostors.

Jalon : **J2** (`docs/roadmap.md`, J2-04).

## User story

As the client, I want L2/L3 tiles so that the whole commune is visible to the horizon within the draw-call and memory budgets.

## Acceptance criteria
- [ ] Given L1 tiles, When `lod-build` runs, Then L2 (1 km) and L3 (2 km) render tiles are built: terrain at a coarser resolution, water, major roads only, buildings merged into simplified block volumes (impostor boxes per city block / height class).
- [ ] Given the manifest, Then it lists L2 and L3 keys and hashes.
- [ ] Given the budgets, Then each L2/L3 tile stays within §10.4 (triangles and size) and the build fails otherwise.

## Out of scope

- Octahedral vegetation impostors (frontend, J2-07).

## Technical notes

Same render-only format as L1 (`geom.glb`). Frame: tile south-west corner, x = east, z = north once loaded (glTF x = −east).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
