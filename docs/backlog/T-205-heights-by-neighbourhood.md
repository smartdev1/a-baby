---
id: T-205
title: Height heuristics by neighbourhood profile (quartiers of Yopougon)
status: todo
owner: backend
author_of_code:
priority: P2
size: M
---

## Context

Heights without OSM tags (≈ 95 % of buildings) come from type-based heuristics only. ARCHITECTURE §11.3 asks for neighbourhood profiles (SICOGI blocks, courtyard housing, commercial axes…) whose polygons must be validated by the owner.

Jalon : **J2** (`docs/roadmap.md`, J2-03).

## User story

As a player, I want each quartier to have its own skyline so that Yopougon looks like itself.

## Acceptance criteria
- [ ] Given `content/` neighbourhood profiles (name, polygon source, level distribution), When `06-heights` runs, Then buildings without height or levels draw their levels in the profile of the neighbourhood containing them (seeded per OSM id).
- [ ] Given OSM `place=suburb|quarter|neighbourhood` areas, Then they provide the default polygons; missing ones are listed for the owner.
- [ ] Given the owner has not validated the profiles, Then they are marked `reviewedBy: null` like the brand table.

## Out of scope

- Drawing new polygons by hand.

## Technical notes

Owner validation needed for the profile list and distributions.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
