---
id: T-301
title: `@skyline/content-schema` v0: Zod schemas of actions, needs, place types, jobs and items + generated JSON Schema
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context

Actions are data, not code (ADR 0004). Every content file needs one source of truth for its shape, shared by content-cli, the zone server and the client preview.

Jalon : **J3** (`docs/roadmap.md`, J3-01).

## User story

As a content author, I want strict schemas with editor autocompletion so that a wrong action file is caught before it reaches the game.

## Acceptance criteria
- [x] Given an action file shaped as ARCHITECTURE §15.3, Then `ActionSchema` parses it; mandatory fields are `id`, `version`, `category`, `labelKey`, `where`, `duration`, `effects`.
- [x] Given the needs config, place types, jobs and items, Then each has its schema (`NeedsConfigSchema`, `PlaceTypeSchema`, `JobSchema`, `ItemSchema`) with ids `category.name_snake` and game-time durations.
- [x] Given the schemas, Then JSON Schemas are generated from Zod (no hand-written copy) for VS Code autocompletion.
- [x] Given invalid files (unknown effect type, bad time window, negative duration), Then parsing fails with the path of the error.

## Out of scope

- Transport lines, housing and businesses schemas (J4–J6).

## Technical notes

Zod 4 `z.toJSONSchema`. Pure package (no Node APIs).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — Schemas in `packages/content-schema/src/`: ids and game times, needs config, effect registry (7 MVP types), action (§15.3), place type, job, item; JSON Schemas generated with `z.toJSONSchema` (input shape).
- Sample content: `content/needs/needs.config.json` (calibrated: about two meals, one wash and one night per game day), 4 actions (`food.eat_garba`, `rest.sleep_bench`, `hygiene.wash_public_shower`, `worship.pray_church`), 10 place types (garba stand, maquis, bench, public toilets, church, mosque, hair salon, boutique, football ground, cybercafe).
- **Owner — inconsistency in ARCHITECTURE §15.3**: the example `eat_garba` uses `hunger delta -55` with `requires hunger max 90` (hunger as a lack), while §16.2 says a need at 0 applies penalties (satisfaction). The schemas and content use the §16.2 model: 100 = satisfied, eating gives `+55`. Please fix the §15.3 example (owner-only file).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
