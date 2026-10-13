---
id: T-111
title: Pipeline stage `naming` v0: real toponyms, parodied brands and shops
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Tile places have `displayName: null`. Owner decision: real street and public place names, parodied brands and shops (e.g. Orange → Oronge).

Jalon : **J1** (`docs/roadmap.md`, ADR 0010 (J2 pulled forward)). Dépend de : T-012. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As a player, I want to see place names that feel like Yopougon without real brands so that the city is recognizable and legally safe.

## Acceptance criteria

- [ ] Given `content/place-names/brand-parodies.json` (human-reviewed table), Then known brands get their parody; an unknown brand tag (`brand=*`) fails the build until it is added.
- [ ] Given other shops, Then names are deformed deterministically (seed = OSM id, minimum edit distance) and public places / streets keep their real names.
- [ ] Given `content/place-names/overrides/<osmId>.json`, Then renames and removals on request are applied.
- [ ] Given `meta.json`, Then `displayName` is filled only by this stage and escaped as text.

## Out of scope

- Shop signs rendering (frontend).

## Technical notes

ADR 0010, ARCHITECTURE §3.4. The brand table needs the owner's review.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
