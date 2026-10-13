---
id: T-022
title: Reproducible OSM acquisition: sources.lock, osmium Docker image, acquire and extract stages
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
L'export actuel a été fait à la main sur overpass-turbo, avec une requête non versionnée ; il n'est pas reproductible (M7). ARCHITECTURE §11 retient un instantané Geofabrik figé et `osmium` dans Docker (postes Windows).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-010.

## User story
En tant que développeur du pipeline, je veux obtenir exactement les mêmes données sources que mes collègues afin que nos builds soient identiques.

## Acceptance criteria
- [ ] Given `data/sources/sources.lock.json` (versionné), Then il contient pour OSM : fournisseur, URL, date de l'instantané, sha256, licence ; pour la limite : identifiant de relation (rempli par T-018).
- [ ] Given l'étape `acquire`, When le fichier en cache a un sha256 différent du lock, Then l'étape échoue avec un message explicite ; sinon elle ne retélécharge rien.
- [ ] Given `infra/docker/osmium/Dockerfile`, Then l'image est figée par digest ; l'étape `extract` l'appelle via Docker avec des chemins compatibles Windows et Linux et produit le pbf de la commune + 300 m de marge, puis l'export GeoJSONSeq.
- [ ] Given deux exécutions sur deux postes (Windows et Linux), Then les sorties d'`extract` ont le même sha256 (consigné en recette).
- [ ] Given `.gitignore`, Then `data/cache/` et `data/build/` sont ignorés.

## Out of scope
- Exécuter le pipeline complet sur la commune (J2).

## Technical notes
Action réseau externe (téléchargement) et ajout d'un Dockerfile : accord du propriétaire requis. Préparé, l'image est construite par le propriétaire ou avec son accord. Réf. ARCHITECTURE §11.1, §11.2.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
