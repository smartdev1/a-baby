---
id: T-304
title: `content-cli validate | compile`: content checked against the schemas and cross references, compiled packs
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

Content must be valid before it reaches the servers or the client (CI gate of J3: 100 % of action files validated).

Jalon : **J3** (`docs/roadmap.md`, J3-02).

## User story

As a content author, I want one command that tells me what is wrong in my files so that I can add an action without asking a developer.

## Acceptance criteria
- [x] Given `content/`, When `pnpm content:validate` runs, Then every file is parsed with its schema and cross references are checked (place types, items, jobs, needs, effect types); errors name the file and the path.
- [x] Given i18n keys missing from `content/i18n`, Then they are reported (warning until the frontend catalogue exists, error with `--strict`).
- [x] Given `pnpm content:compile`, Then deterministic packs are written per category (actions, place types, jobs, items, needs) for the servers and the client.

## Out of scope

- Hot reload of content in running servers.

## Technical notes

Packs are sorted by id, JSON with stable key order.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §15 et §16. Toute nouvelle dépendance exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `tools/content-cli/src/`: discovery by suffix, Zod parsing, cross references (place types, site kinds, work actions, items), duplicate ids, file name ↔ id, i18n texts (warnings; errors with `--strict`), deterministic packs, generated JSON Schemas in `tools/content-cli/schemas/` (referenced by `$schema` in content files). Root scripts `content:validate`, `content:compile`, `content:schemas`.
- Current content: 15 files, 0 error, 16 warnings (fr-CI texts not written yet — frontend catalogue).
- **Frontend to confirm**: i18n catalogue format assumed as `content/i18n/<locale>/*.json` with nested objects (keys flattened with dots).
- CI: add `pnpm content:validate` to `infra/ci/ci.yml` when the CI is activated (owner).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
