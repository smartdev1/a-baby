---
id: T-316
title: `sim-transport`: deterministic line vehicles, frequencies by game time
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: L
---

## Context

ARCHITECTURE §17.3: the position of a line vehicle is a pure function of (line, service number, clock), computed by `sim-transport` on the client and the server; nothing to replicate while the vehicle keeps to its timetable.

Jalon : **J4** (`docs/roadmap.md`, J4-01).

## User story

As a player, I want gbakas, woro-woros and SOTRA buses to run on the real lines with frequencies that follow the time of day, so that I can wait for one at a stop and board it.

## Acceptance criteria
- [x] Given a line (path, stops) and the service profile of its mode, When the timetable is built, Then the trip plan has a dwell at every stop and the departures follow the headway of each period of the game day (midnight crossing included).
- [x] Given a game time, Then `vehiclesAt` returns the vehicles on the road with position, heading, next stop and docked stop, identical for identical inputs.
- [x] Given a stop and a game time, Then `dockedVehicleAt` returns the vehicle dwelling there (for boarding) and `nextArrivalAt` the next arrival.
- [x] Service profiles are game content validated by `content-cli`.

## Out of scope

- Boarding, seats and accelerated travel in the zone (J4-06), fares and payment, woro-woro "leave when full" (server-driven).

## Technical notes

Speeds are what players see in real time; they are converted to metres per game minute with the **nominal** clock ratio (`content/game-config/clock.json`), not the live segment, so a live ratio change only changes the visible speed and never moves the vehicles. Headways and dwells are in game minutes.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `packages/sim-transport/src/polyline-measure.ts`, `line-schedule.ts`, `line-vehicles.ts` (+ tests, property test of determinism).
- Service ids `day.period.k`; per-line phase = FNV-1a of the line id × headway, so lines do not all leave at 05:00.
- Content kind `transport-service` (`packages/content-schema/src/transport-schemas.ts`), files `content/transport/services/<mode>.service.json` (gbaka, woro_woro, sotra_bus, bus), pack `transport-services.pack.json`, JSON Schema generated.
- **Owner review needed**: speeds, dwells, seats, fares and headways are first guesses; `services/` is a new content folder (ARCHITECTURE §17.2 lists `lines/` and `fares/` only).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
