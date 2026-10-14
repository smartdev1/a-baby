---
id: T-305
title: Pipeline stage `places-sites`: OSM places → typed places and action sites per tile
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Actions happen at sites (a garba stand counter, a maquis table, a church). The map has 17 925 OSM places with game categories; the zone needs typed places with sites to reserve.

Jalon : **J3** (`docs/roadmap.md`, J3-06).

## User story

As the zone server, I want every place of Yopougon with its place type and sites so that actions can be offered and reserved where they make sense.

## Acceptance criteria
- [ ] Given `content/place-types` (MVP types with OSM categories, sites, capacity, opening hours), When `places-sites` runs, Then each OSM place gets a place type (or none) and its sites are positioned around it (seeded), written per L0 tile.
- [ ] Given a place inside a building, Then its sites are placed inside the footprint; street places get sites on the sidewalk side.
- [ ] Given the report, Then counts per place type and places without type are listed.

## Out of scope

- Interiors (J3-12).

## Technical notes

Place types are content (validated by content-schema).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
