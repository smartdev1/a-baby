---
id: T-320
title: Zone: boarding line vehicles, seats, fare and accelerated travel
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: M
---

## Context

ARCHITECTURE §17.3: `board` is accepted if the vehicle is docked at the same stop with a free seat; accelerated travel ("doze until my stop"): the player leaves the vehicle and reappears at the chosen stop after a short delay, once the fare is paid. The world is not accelerated, only the trip.

Jalon : **J4** (`docs/roadmap.md`, J4-06).

## User story

As a player waiting at a gbaka or SOTRA stop, I want to board the vehicle when it is there, pay the fare and get off at my stop.

## Acceptance criteria
- [x] Given a player within 25 m of a stop of the line, a vehicle of the timetable docked there and a free seat, When it asks for a later stop, Then the fare is debited once and the player is boarded.
- [x] Given no docked vehicle, Then the refusal gives the next arrival in game minutes.
- [x] Given a replayed request, Then the same answer and no second debit.
- [x] Given the accelerated delay over, Then the player stands at the destination stop (handed over if it lies in another cell of the cluster); stops in unowned cells are refused.

## Out of scope

- Riding seated in a visible vehicle, getting off early (client vehicle views, J4-07), taxis (J4-05), woro-woro departures when full.

## Technical notes

Protocol v4: client `rideRequest` (9), server `rideUpdate` (112). Seats are counted per vehicle service (`lineId#serviceId`) while riders are aboard. The timetable is the shared pure function of `sim-transport`, so the server never replicates vehicles.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `packages/protocol/src/messages/ride-schemas.ts` (+ tests), `PROTOCOL_VERSION = 4`; `CellAction` carries `rideRequest`; the gateway forwards it.
- `apps/zone/src/transport/` (`transit-network.ts`, `ride-service.ts`, `cell-rides.ts`, tests); `DailyLife.characterOf` / `refreshWallet`; `ZoneCell` option `transit`, riders skipped by the physics and the snapshot, arrivals placed each tick; `applyInputs` extracted from `simulate`.
- Wired in the zone process and the all-in-one (network loaded from `SKYLINE_WORLD_DIR`).
- Real data: 341 lines in ≈ 140 ms, ≈ 4 500 vehicles at 08:00 computed in ≈ 11 ms.
- **Follow-ups**: the client needs the lines too (to draw vehicles and stops): `transit-lines` should go into the world release (17-manifest) — to decide with the frontend. Owner review of the accelerated delay (a sixth of the trip, 3–20 s).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
