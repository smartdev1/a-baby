---
id: T-322
title: Zone: metered taxis (virtual fleet, pickup, ride, fare)
status: review
owner: backend
author_of_code: Ky-Wilson
priority: P1
size: M
---

## Context

ARCHITECTURE §17.1: hail a taxi in the street → NPC taxi assigned from a virtual fleet → trip computed on the road graph → metered fare (pickup + distance), `fare:{rideId}`.

Jalon : **J4** (`docs/roadmap.md`, J4-05).

## User story

As a player in Yopougon, I want to hail an orange taxi from the street and be driven to a place, paying the meter.

## Acceptance criteria
- [x] Given a player within 30 m of a drivable road and a known place in an owned cell, Then a taxi is assigned with an ETA, the route distance and its fare.
- [x] Given the taxi arrives and the player waited by the road, Then the fare is charged once and the player rides; else the taxi leaves (`missed`, nothing charged).
- [x] Given the accelerated drive is over, Then the player stands on the road in front of the place.
- [x] A player in a line ride cannot hail a taxi and the other way round; a replayed request gets the same answer.

## Out of scope

- Taxi stations, a visible taxi fleet with positions, the client (hail gesture, map of destinations).

## Technical notes

Protocol v6: client `taxiRequest` (10), server `taxiUpdate` (114). Content: `content/transport/fares/taxi.fare.json` (schema `taxi-fare`). The fare is charged at **pickup** rather than at arrival (§17.1): the route is fixed, so the amount is known, and a player out of the street cannot spend the money meanwhile — to confirm by the owner.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md.

## Implementation log

- `packages/content-schema` `TaxiFareSchema` (+ content-cli kind `taxi-fare`, pack, JSON Schema); `content/transport/fares/taxi.fare.json` (values to review).
- `packages/protocol/src/messages/taxi-schemas.ts`, `PROTOCOL_VERSION = 6`; client encoder simplified like the server one.
- `apps/zone/src/transport/`: `city-map.ts`, `taxi-service.ts` (+ tests), `transport-setup.ts`; `cell-rides.ts` now builds `CellTransport` (rides + taxis); `ZoneCell` option `transport { transit, city, taxiFare }`; gateway and bus forward `taxiRequest`.
- Real data: load ≈ 320 ms (341 lines, 7 629 places); 100 random routes: 4.7 km on average, 1.3 ms of A*, ≈ 1 480 Djai.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
