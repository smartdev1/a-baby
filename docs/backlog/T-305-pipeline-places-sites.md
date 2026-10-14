---
id: T-305
title: Pipeline stage `places-sites`: OSM places → typed places and action sites per tile
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

Actions happen at sites (a garba stand counter, a maquis table, a church). The map has 17 925 OSM places with game categories; the zone needs typed places with sites to reserve.

Jalon : **J3** (`docs/roadmap.md`, J3-06).

## User story

As the zone server, I want every place of Yopougon with its place type and sites so that actions can be offered and reserved where they make sense.

## Acceptance criteria
- [x] Given `content/place-types` (MVP types with OSM categories, sites, capacity, opening hours), When `places-sites` runs, Then each OSM place gets a place type (or none) and its sites are positioned around it (seeded), written per L0 tile.
- [x] Given a place inside a building, Then its sites are placed inside the footprint; street places get sites on the sidewalk side.
- [x] Given the report, Then counts per place type and places without type are listed.

## Out of scope

- Interiors (J3-12).

## Technical notes

Place types are content (validated by content-schema).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `src/places/` (place type catalogue from `content/place-types`, site placement inside / front / around), stage `13-places-sites` (`places-sites.ndjson`, `places-report.json`), `TilePlaceSchema` gains optional `placeType` and `sites` (kind, capacity, tile-local position, yaw), written by tile-cut v6 into `meta.json`. `PlacementGuards.footprintAt`.
- Yopougon: 7 098 typed places (boutique 2 564, maquis 2 093, hair salon 1 198, church 488, football ground 207, public toilets 148, mosque 147, cybercafe 129, bench 98, garba stand 26); categories still without a place type are listed in the report (bus stops, tailors, schools, Mobile Money kiosks…) for wave A content (J3-13).
- Frontend: sites are in `meta.json` for action detection (J3-07).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
