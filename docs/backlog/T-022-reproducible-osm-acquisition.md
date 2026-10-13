---
id: T-022
title: Reproducible OSM acquisition: sources.lock, osmium Docker image, acquire and extract stages
status: done
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context
L'export actuel a été fait à la main sur overpass-turbo, avec une requête non versionnée ; il n'est pas reproductible (M7). ARCHITECTURE §11 retient un instantané Geofabrik figé et `osmium` dans Docker (postes Windows).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-010.

## User story
En tant que développeur du pipeline, je veux obtenir exactement les mêmes données sources que mes collègues afin que nos builds soient identiques.

## Acceptance criteria
- [x] Given `data/sources/sources.lock.json` (versionné), Then il contient pour OSM : fournisseur, URL, date de l'instantané, sha256, licence ; pour la limite : identifiant de relation (rempli par T-018).
- [x] Given l'étape `acquire`, When le fichier en cache a un sha256 différent du lock, Then l'étape échoue avec un message explicite ; sinon elle ne retélécharge rien.
- [x] Given `infra/docker/osmium/Dockerfile`, Then l'image est figée par digest ; l'étape `extract` l'appelle via Docker avec des chemins compatibles Windows et Linux et produit le pbf de la commune + 300 m de marge, puis l'export GeoJSONSeq.
- [ ] Given deux exécutions sur deux postes (Windows et Linux), Then les sorties d'`extract` ont le même sha256 (consigné en recette). — *Linux vérifié (2 exécutions identiques) ; Windows à confirmer par le 2e développeur.*
- [x] Given `.gitignore`, Then `data/cache/` et `data/build/` sont ignorés.

## Out of scope
- Exécuter le pipeline complet sur la commune (J2).

## Technical notes
Action réseau externe (téléchargement) et ajout d'un Dockerfile : accord du propriétaire requis. Préparé, l'image est construite par le propriétaire ou avec son accord. Réf. ARCHITECTURE §11.1, §11.2.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- 2026-10-13 — Owner approved the download and the Docker image.
  - Snapshot: Geofabrik `ivory-coast-261001.osm.pbf` (2026-10-01, 85 505 577 bytes), md5 matches Geofabrik's `.md5`; sha256 `68ec1fda…d18d5` recorded in `data/sources/sources.lock.json`. Not committed to git (85 MB: GitHub warns above 50 MB, every update would bloat the history forever); `01-acquire` downloads and verifies it automatically on first build.
  - `infra/docker/osmium/Dockerfile`: `debian:trixie-slim@sha256:a29215f6…` + `osmium-tool=1.18.0-1`; built as `skyline/osmium:1.18.0` (`pnpm map:osmium-image`).
  - Stages: `01-acquire` (download once, sha256 check, explicit error on mismatch), `02-extract` (bbox + 300 m margin, `complete_ways`, tags-filter, no user metadata), `03-export` (GeoJSONSeq with `@type`/`@id`; fixture path converts the FeatureCollection, so later stages have one input format).
  - Config: `boundary.provisionalBboxLonLat` added (Yopougon `[-4.175, 5.295, -4.005, 5.43]`) until the relation id is confirmed by T-018.
  - Runner fix: the input hash is recomputed after a stage runs (a stage can create its own declared input), found by the acquire tests.
- Measures (Linux, Node 24, Docker 29): full build 7.4 s; cached rebuild 0.8 s; `--force` twice → identical sha256 (`commune.osm.pbf` 918d36cc…, `features.geojsonseq` 589b2153…). Yopougon bbox: 4.6 MB pbf, 297 541 features.
- Tests: 31 in the package (acquire with fake downloader, osmium args, bbox margin, fixture conversion).

## Review
- Reviewed and merged by smartdev1 in PR #5.

## QA report
(filled by the QA agent)
