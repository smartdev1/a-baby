---
id: T-304
title: `content-cli validate | compile`: content checked against the schemas and cross references, compiled packs
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

Content must be valid before it reaches the servers or the client (CI gate of J3: 100 % of action files validated).

Jalon : **J3** (`docs/roadmap.md`, J3-02).

## User story

As a content author, I want one command that tells me what is wrong in my files so that I can add an action without asking a developer.

## Acceptance criteria
- [ ] Given `content/`, When `pnpm content:validate` runs, Then every file is parsed with its schema and cross references are checked (place types, items, jobs, needs, effect types); errors name the file and the path.
- [ ] Given i18n keys missing from `content/i18n`, Then they are reported (warning until the frontend catalogue exists, error with `--strict`).
- [ ] Given `pnpm content:compile`, Then deterministic packs are written per category (actions, place types, jobs, items, needs) for the servers and the client.

## Out of scope

- Hot reload of content in running servers.

## Technical notes

Packs are sorted by id, JSON with stable key order.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
