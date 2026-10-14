---
id: T-312
title: Wave A content draft: about 30 more actions, items and place types (owner review)
status: todo
owner: backend
author_of_code:
priority: P1
size: M
---

## Context

J3 needs ≈ 35 playable actions with a night variant per category (ARCHITECTURE §15.6). Content is data: the backend drafts it, the owner validates the Ivorian details.

Jalon : **J3** (`docs/roadmap.md`, J3-13).

## User story

As a player, I want to eat alloco, drink bissap, wash at home, pray at the mosque, browse at the cybercafe, play football and buy bread so that daily life in Yopougon is rich.

## Acceptance criteria
- [ ] Given `content/`, Then ≥ 35 actions validate with content-cli, every category has at least one action available at night (19:00–06:00), and items exist for purchases.
- [ ] Given the draft, Then every file is marked for owner review in the backlog (prices, durations, names).

## Out of scope

- Texts (frontend i18n), animations (art).

## Technical notes

Prices in Djai consistent with wages (2 500–3 500 per shift).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
