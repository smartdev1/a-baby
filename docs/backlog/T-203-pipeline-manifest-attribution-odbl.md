---
id: T-203
title: Pipeline stage `manifest-attribution`: ATTRIBUTION file and ODbL archive of the `osm-derived` layer
status: todo
owner: backend
author_of_code:
priority: P1
size: S
---

## Context

ODbL requires attribution and making the derived database available (ADR 0006). The world manifest already carries the licence; the release has no ATTRIBUTION file nor archive of the derived layer.

Jalon : **J2** (`docs/roadmap.md`, J2-13).

## User story

As the owner, I want every world release to ship its attribution and the ODbL-derived data so that SkyLine complies with the OpenStreetMap licence.

## Acceptance criteria
- [ ] Given a release, When `17-manifest` runs, Then it writes `ATTRIBUTION.md` (OSM, Copernicus DEM, generation date, snapshot) and `osm-derived.<release>.tar.gz` containing the OSM-derived records (normalized, classified, buildings, roads, place names) with a README stating the ODbL.
- [ ] Given the archive, Then its sha256 is listed in the manifest and the build is deterministic (fixed mtime, sorted entries).
- [ ] Given the fixture, Then the golden test covers the archive hash.

## Out of scope

- Publishing the archive online (owner, at release time).

## Technical notes

No new dependency: tar written with Node (`zlib`) and a minimal ustar writer.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
