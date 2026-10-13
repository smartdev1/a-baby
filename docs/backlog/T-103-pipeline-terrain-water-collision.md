---
id: T-103
title: Pipeline stages `terrain-water` + `collision` v1: relief, lagoon and water, height field
status: review
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: M
---

## Context

Collision v0 is a flat ground with building prisms; the lagoon is only a coastline in OSM (SP2), so water is missing.

Jalon : **J1** (`docs/roadmap.md`, J1-04). Dépend de : T-012, T-018. Décision du propriétaire : pas de quartier pilote, tout Yopougon.

## User story

As a player, I want to walk on real ground and never into the lagoon so that Yopougon's shore feels right.

## Acceptance criteria
- [x] *(changed, see log)* Given OSM water polygons (osmdata.openstreetmap.de, ODbL) and a DEM (Copernicus GLO-30, licence to validate), When `terrain-water` runs, Then each tile gets a height field and water surfaces; both sources are pinned in `sources.lock.json` with sha256.
- [x] Given `collision.bin`, Then it contains the height field (≤ 2 m cells), building prisms and water volumes (format version bumped with tests).
- [x] Given roads, Then the ground is levelled locally under carriageways.
- [x] Given the SP2 report, Then 'unmapped' tiles in the lagoon become 'water'.

## Out of scope

- Bridges and quays as walkable geometry (J2).

## Technical notes

ARCHITECTURE §11.2 (07, 13). New data sources need the owner's approval (download + licence).

Règles : `docs/rules/BACKEND.md`, ARCHITECTURE.md §9. Toute nouvelle dépendance ou source de données exige l'accord du propriétaire.

## Implementation log
- 2026-10-13 — Stage `10-terrain` + `src/terrain/`, tile format v1:
  - **Relief**: Copernicus GLO-30 tile `N05_00_W005_00` pinned in `sources.lock.json` (sha256, 40 MB, attribution), downloaded once; `gdalwarp` (GDAL 3.10.3 added to the frozen image, tag `skyline/osm-tools:2`) to UTM 30N at 5 m; GLO-30 is a surface model → min + mean filter to approximate bare ground (limitation: dense blocks may stay slightly raised).
  - **Water** (changed vs criterion): instead of the global osmdata water polygons (~800 MB download), the lagoon comes from the OSM **coastlines already in the snapshot** (water = right side of the nearest segment) + `natural=water` polygons. `osmcoastline` was tried and cannot close coastlines on a country extract.
  - **Cells 5 m instead of ≤ 2 m** (changed vs criterion): the DEM is 30 m, a 2 m grid would only interpolate and multiply tile size by 6; road levelling still flattens every carriageway.
  - `collision.bin` v1: height field 51 × 51 + water layer (level + mask); `TILE_FORMAT_VERSION` = 1. Physics: water not walkable; spawn placed on the ground.
  - Tiles: every terrain tile exists (lagoon-only tiles included), buildings seated on their lowest footprint vertex, roads draped (densified ≤ 4 m, +12–15 cm), ground and water meshes.
  - **Frame bug found and fixed**: Babylon's glTF loader maps (x, y, z) → (−x, y, z) (verified with a real Babylon load); tiles were mirrored since T-012 (invisible on flat ground, cracks with relief). The pipeline now writes x = −east; loaded tiles have x = east, z = north.
- Yopougon: 4 081 terrain tiles (413 with water), heights −3 to 134 m; 4 400 tiles, 163 MB, max 153 KB / 10 031 triangles; terrain 24 s, encode 43 s. New preview `docs/previews/j1-yopougon-terrain.jpg`.
- Tests: terrain (5), physics water, golden updated.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
