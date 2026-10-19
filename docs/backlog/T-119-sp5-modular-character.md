---
id: T-119
title: SP5 — modular character, animation, crowd VAT
status: todo
owner: frontend
author_of_code: (to be filled)
priority: P1
size: M
---

## Context

Spike SP5: modular character (skeleton + clothing + hairstyles including braids) + vertex animation textures (VAT) for 200 ambient NPCs. Measure CPU/GPU cost.

Jalon : **J1** (`docs/roadmap.md`). Dépend de : T-113.

## User story

As a developer, I want measured proof that modular characters and crowd VAT fit the performance budget, so we can commit to the visual approach.

## Acceptance criteria

- [ ] Given 200 NPCs with VAT, Then CPU and GPU cost measured and within budget.
- [ ] Given modular character, Then skeleton + clothing + hairstyles (incl. braids) work.
- [ ] Given results, Then animation pipeline is chosen and documented.

## Out of scope

- Final avatar editor (J1-17).
- Combat animations (v2).

## Technical notes

Ref. roadmap §3.1 (SP5), §4 (J1-16). Couloir C + artiste.

## Implementation log

(to be filled)

## Review

(to be filled)

## QA report

(to be filled)
