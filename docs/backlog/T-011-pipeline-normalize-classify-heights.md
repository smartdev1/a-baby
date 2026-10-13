---
id: T-011
title: Pipeline stages normalize, classify and heights v0 with golden fixture
status: review
owner: fullstack-devops
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context
`GeoJSONImporter` contient la meilleure taxonomie de POI du projet, mais il ignore les MultiPolygones et les POI surfaciques, produit des `NaN` sur `building:levels="2;3"`, utilise des identifiants aléatoires et normalise à 300 (C1, M3, M7, m9).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-010.

## User story
En tant que pipeline, je veux des données OSM normalisées, classées et dotées de hauteurs plausibles afin de générer des tuiles fidèles et reproductibles.

## Acceptance criteria
- [x] Given `data/source/export.geojson`, When la tâche est livrée, Then il est déplacé dans `tools/map-pipeline/test/fixtures/pigeons-sample.geojson`, mention ODbL conservée.
- [x] Given l'étape `normalize`, Then elle parse les tags de façon robuste (`"2;3"` → 3, unités de `height`, valeurs invalides → absentes, jamais `NaN`), conserve Polygon et MultiPolygon, et attribue des identifiants stables `osm:{type}/{id}`.
- [x] Given l'étape `classify`, Then elle reprend et étend la taxonomie de POI existante, y compris les POI surfaciques (une école cartographiée en polygone est un lieu).
- [x] Given l'étape `heights` v0, Then l'ordre de priorité est `height` > `building:levels` > heuristique (type + emprise + profil par défaut), tiré avec une graine dérivée de l'id OSM ; `heightSource` est renseigné.
- [x] Given deux exécutions successives sur la fixture, Then les sorties ont le même sha256 (**test golden en CI**).
- [x] Given les sorties, Then aucune coordonnée n'est normalisée : tout est en mètres UTM via `@skyline/geo`.

## Out of scope
- Profils de quartiers réels (J2-03).
- Eau, relief, routes (J1, J2).

## Technical notes
Réf. ARCHITECTURE §11.2 (étapes 04-06), §11.3. Le code source de `GeoJSONImporter` reste lisible dans l'historique git.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- 2026-10-13 — Stages `04-normalize`, `05-classify`, `06-heights` (NDJSON, streaming, input order kept):
  - `src/osm/`: stable `osm:{type}/{id}` ids (osmium and overpass formats); robust `building:levels` (`2;3`, `R+2`, decimals) and `height` (units, comma, feet) parsing; implausible values (> 60 levels, > 250 m — e.g. `75` levels and `421` m found in Yopougon) dropped, never NaN.
  - Coordinates converted to UTM 30N metres (cm) through `@skyline/geo`; no normalization or scaling anywhere. Areas always MultiPolygon.
  - `src/taxonomy/`: legacy taxonomy extended to game categories `domain.kind` (maquis = `amenity=pub`, Mobile Money, worship by religion, beauty, crafts, transport stops…), areal POIs included.
  - `src/heuristics/height-heuristics.ts`: `height` > `building:levels` > seeded heuristic (single-volume ranges; level distributions by type, or by footprint area for `building=yes`); `heightSource` set.
  - Golden test `src/stages/pipeline-golden.test.ts` + `test/golden/pigeons-fixture.sha256.json`: two runs byte-identical and equal to committed hashes (`UPDATE_GOLDEN=1` to update on purpose).
- Fixture already moved to `tools/map-pipeline/test/fixtures/pigeons-sample.geojson` (J0 foundations PR).
- Whole Yopougon: 5.4 s for the 3 stages; 74 702 buildings (1 240 OSM heights, 73 462 heuristic; 59 % 1 level, 28 % 2, 10 % 3); 17 925 places.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
