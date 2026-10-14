---
id: T-205
title: Height heuristics by neighbourhood profile (quartiers of Yopougon)
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P2
size: M
---

## Context

Heights without OSM tags (≈ 95 % of buildings) come from type-based heuristics only. ARCHITECTURE §11.3 asks for neighbourhood profiles (SICOGI blocks, courtyard housing, commercial axes…) whose polygons must be validated by the owner.

Jalon : **J2** (`docs/roadmap.md`, J2-03).

## User story

As a player, I want each quartier to have its own skyline so that Yopougon looks like itself.

## Acceptance criteria
- [x] Given neighbourhood profiles (in the pipeline config, as ARCHITECTURE §11.3 says, not `content/`) (name, polygon source, level distribution), When `06-heights` runs, Then buildings without height or levels draw their levels in the profile of the neighbourhood containing them (seeded per OSM id).
- [x] Given OSM `place=suburb|quarter|neighbourhood` areas, Then they provide the default polygons; missing ones are listed for the owner.
- [x] Given the owner has not validated the profiles, Then they are marked `reviewedBy: null` like the brand table.

## Out of scope

- Drawing new polygons by hand.

## Technical notes

Owner validation needed for the profile list and distributions.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `config/yopougon.neighbourhoods.json` (5 profiles: `sicogi`, `planned-houses`, `courtyard`, `village`, `industrial`; 57 OSM names + 5 name patterns; `reviewedBy: null`); `src/config/neighbourhood-profiles.ts` (schema, accent-free name keys, exact name then pattern); `src/heuristics/neighbourhood-index.ts` (containing neighbourhood polygon > nearest neighbourhood/village point > nearest suburb point, 1.2 km; commune-wide suburb polygons ignored); `06-heights` v2 applies the profile to generic buildings without OSM height (≥ 40 m²) and writes `heights-report.json`.
- Yopougon: 47 539 buildings from profiles; 10 359 buildings in 50 neighbourhoods without profile (Gbamnan Djidan 2 Franceville, Kilomètre 17, Camp militaire, Nouveau bureau, Micao…) — **owner: complete or correct the table, then set `reviewedBy`**. All tiles stay within budget (L0 max 331 KB).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
