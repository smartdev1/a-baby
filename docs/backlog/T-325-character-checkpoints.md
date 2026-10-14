---
id: T-325
title: Character checkpoints: position and needs saved every 60 s and at disconnection
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: M
---

## Context

ARCHITECTURE §13.5: position, needs and current action saved every 60 s, at disconnection and on transfers to an instance, through a `CharacterStorePort`; a zone crash loses at most 60 s of non-monetary state. With guest accounts (T-324) characters now have stable ids.

Jalon : **J6** (`docs/roadmap.md`, J6-04, without the database).

## User story

As a player, I want to find my character where I left it, with its needs, when I come back.

## Acceptance criteria
- [x] Guest characters are saved every 60 s and when their session ends; anonymous dev sessions never.
- [x] A character joining again starts at its saved position (if that cell belongs to the cluster) with its saved needs.
- [x] Checkpoints never contain secrets; character ids are restricted to safe characters in the file store.

## Out of scope

- The characters service and PostgreSQL (J6-01, owner approval), saving the current action, the offline rule for needs (§16.1, Q14: needs are frozen while offline for now), optimistic concurrency.

## Technical notes

`FileCharacterStore` writes `data/runtime/characters/<characterId>.json` atomically; zones on one machine share the folder. The wallet stays in the in-memory economy until the ledger (J6-05).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `apps/zone/src/ports/character-store-port.ts`, `adapters/file-character-store.ts`, `cell/character-checkpoints.ts` (+ tests); `ZoneCell` option `characters`, `characterIds` per session (carried by handoffs), checkpoint every 60 s and on `session.closed`.
- Zone config `SKYLINE_RUNTIME_DIR`; wired in the zone process and the all-in-one.
- `ZoneCell.flush()` saves every guest character at graceful shutdown (a dropped socket waits 60 s for a resume before `session.closed`, so a restart inside that window lost the last position).
- End-to-end check on a real all-in-one (T-324 + T-325 + T-326): guest account → ticket → walk 9 m → restart → same account comes back at the same position with the same 5 000 Djai, starter grant paid once.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
