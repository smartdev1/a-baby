---
id: T-103
title: Pipeline stages `terrain-water` + `collision` v1: relief, lagoon and water, height field
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Collision v0 is a flat ground with building prisms; the lagoon is only a coastline in OSM (SP2), so water is missing.

Jalon : **J1** (`docs/roadmap.md`, J1-04). Dépend de : T-012, T-018. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As a player, I want to walk on real ground and never into the lagoon so that Yopougon's shore feels right.

## Acceptance criteria

- [ ] Given OSM water polygons (osmdata.openstreetmap.de, ODbL) and a DEM (Copernicus GLO-30, licence to validate), When `terrain-water` runs, Then each tile gets a height field and water surfaces; both sources are pinned in `sources.lock.json` with sha256.
- [ ] Given `collision.bin`, Then it contains the height field (≤ 2 m cells), building prisms and water volumes (format version bumped with tests).
- [ ] Given roads, Then the ground is levelled locally under carriageways.
- [ ] Given the SP2 report, Then 'unmapped' tiles in the lagoon become 'water'.

## Out of scope

- Bridges and quays as walkable geometry (J2).

## Technical notes

ARCHITECTURE §11.2 (07, 13). New data sources need the owner's approval (download + licence).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
