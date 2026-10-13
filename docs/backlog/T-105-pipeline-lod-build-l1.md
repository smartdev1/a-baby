---
id: T-105
title: Pipeline stage `lod-build`: L1 tiles (500 m) with simplified buildings and merged roads
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context
The client needs a coarser level beyond ~300 m to keep FPS on modest PCs.

Jalon : **J1** (`docs/roadmap.md`, J1-09 (pipeline side)). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story
As the client, I want L1 tiles so that distant Yopougon stays visible at low cost.

## Acceptance criteria
- [ ] Given four L0 tiles, Then one L1 tile holds merged, simplified building volumes and roads (meshopt simplify), within its budget.
- [ ] Given the manifest, Then it lists L1 keys and hashes (split per level when > 1 MB).

## Out of scope
- L2/L3 impostors (J2).

## Technical notes
ARCHITECTURE §10.2. Client side by the frontend (J1-09).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
