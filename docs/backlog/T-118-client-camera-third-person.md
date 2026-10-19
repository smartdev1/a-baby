---
id: T-118
title: Client camera — third-person, abstract inputs (InputIntent), AZERTY/QWERTY
status: todo
owner: frontend
author_of_code: (to be filled)
priority: P1
size: M
---

## Context

Third-person camera with abstract input layer (InputIntent) supporting AZERTY and QWERTY layouts. Decouples raw key presses from game actions.

Jalon : **J1** (`docs/roadmap.md`). Dépend de : T-013.

## User story

As a player, I want a third-person camera and configurable controls, so I can navigate comfortably.

## Acceptance criteria

- [ ] Given the camera, Then third-person follow with smooth tracking.
- [ ] Given AZERTY/QWERTY, Then both layouts produce correct InputIntent.
- [ ] Given input abstraction, Then no raw key codes leak into game logic.

## Out of scope

- First-person camera.
- Gamepad support.

## Technical notes

Ref. roadmap §4 (J1-15). Couloir C.

## Implementation log

(to be filled)

## Review

(to be filled)

## QA report

(to be filled)
