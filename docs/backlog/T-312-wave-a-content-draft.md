---
id: T-312
title: Wave A content draft: about 30 more actions, items and place types (owner review)
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

J3 needs ≈ 35 playable actions with a night variant per category (ARCHITECTURE §15.6). Content is data: the backend drafts it, the owner validates the Ivorian details.

Jalon : **J3** (`docs/roadmap.md`, J3-13).

## User story

As a player, I want to eat alloco, drink bissap, wash at home, pray at the mosque, browse at the cybercafe, play football and buy bread so that daily life in Yopougon is rich.

## Acceptance criteria
- [x] Given `content/`, Then ≥ 35 actions validate with content-cli, every category has at least one action available at night (19:00–06:00), and items exist for purchases.
- [x] Given the draft, Then every file is marked for owner review in the backlog (prices, durations, names).

## Out of scope

- Texts (frontend i18n), animations (art).

## Technical notes

Prices in Djai consistent with wages (2 500–3 500 per shift).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- 2026-10-14 — **40 actions** in 11 categories (food 10, hygiene 3, rest 3, appearance 3, social 3, party 2, sport 2, worship 3, leisure 2, shopping 4, work 5), 3 items (`shop.phone_credit`, `shop.water_sachet`, `shop.soap`), place types `pharmacy` and `cafe_bakery`, a `counter` site at garba stands. content-cli: 0 error; new warning rule for categories without a night variant.
- Night coverage: 10 / 11 categories (91 %, J3 criterion ≥ 60 %); `appearance` has none (salons close at 21:00) — owner: accept, or add a night barber.
- **Owner review needed** (draft values): prices (alloco 300, placali 800, foutou 1 200, kédjénou 2 000, poisson braisé 2 500, bissap 100, tresses 3 000…), durations, opening windows, Ivorian names. Q5 (beer at the maquis) not drafted: `food.drink_soft_maquis` is a soft drink.
- Texts (fr-CI + nouchi) are frontend content: keys follow `action.<category>.<name>.label`.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
