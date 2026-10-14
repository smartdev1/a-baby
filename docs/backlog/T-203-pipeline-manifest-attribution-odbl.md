---
id: T-203
title: Pipeline stage `manifest-attribution`: ATTRIBUTION file and ODbL archive of the `osm-derived` layer
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: S
---

## Context

ODbL requires attribution and making the derived database available (ADR 0006). The world manifest already carries the licence; the release has no ATTRIBUTION file nor archive of the derived layer.

Jalon : **J2** (`docs/roadmap.md`, J2-13).

## User story

As the owner, I want every world release to ship its attribution and the ODbL-derived data so that SkyLine complies with the OpenStreetMap licence.

## Acceptance criteria
- [x] Given a release, When `17-manifest` runs, Then it writes `ATTRIBUTION.md` (OSM, Copernicus DEM, generation date, snapshot) and `osm-derived.<release>.tar.gz` containing the OSM-derived records (normalized, classified, buildings, roads, place names) with a README stating the ODbL.
- [x] Given the archive, Then its sha256 is listed in the manifest and the build is deterministic (fixed mtime, sorted entries).
- [x] Given the fixture, Then the golden test covers the archive hash.

## Out of scope

- Publishing the archive online (owner, at release time).

## Technical notes

No new dependency: tar written with Node (`zlib`) and a minimal ustar writer.

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9 et §11. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log

- 2026-10-14 — `writers/deterministic-tar-gz.ts` (ustar + gzip streamed, fixed mtime = snapshot day, uid/gid 0, mode 0644, gzip OS byte set to 255 so Linux and Windows builds match); `stages/17-manifest/release-attribution.ts` (texts, list of OSM-derived files); `17-manifest` v3 writes `ATTRIBUTION.md` and `osm-derived.<release>.tar.gz` and lists the archive in the manifest (`osmDerived`, `attributionFile`, optional fields of `WorldManifestSchema`).
- Golden test covers both files (two builds, identical bytes).
- Yopougon: archive 20.5 MB (128 MB uncompressed), 8.5 s.
- Owner: publish the archive next to the game at release time; Copernicus licence review still pending (Q8).

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
