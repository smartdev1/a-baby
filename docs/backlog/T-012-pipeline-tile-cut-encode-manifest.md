---
id: T-012
title: Pipeline stages tile-cut, encode and manifest on the fixture
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: L
---

## Context
Le client doit charger des tuiles et non plus un JSON statique. Les bâtiments doivent être triangulés hors ligne (earcut) pour corriger le repli en boîtes englobantes (M1).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-009, T-011.

## User story
En tant que client, je veux des tuiles L0 compactes et triangulées afin d'afficher les vraies formes des bâtiments à l'échelle 1:1.

## Acceptance criteria
- [ ] Given les sorties de T-011, When `tile-cut` s'exécute, Then chaque objet est affecté aux tuiles L0 qu'il recouvre (polygones et polylignes coupés aux bords) ; les métadonnées vont à la tuile de son centroïde.
- [ ] Given `encode`, Then chaque tuile produit `geom.{hash}.glb` (bâtiments extrudés triangulés par earcut, toits plats, rubans de routes à la largeur réelle par classe, sommets locaux à la tuile, meshopt), `collision.{hash}.bin` et `meta.{hash}.json`, validés par `@skyline/tile-format`.
- [ ] Given un bâtiment en L ou en U de la fixture, Then sa géométrie suit l'emprise réelle (écart < 0,05 m), sans boîte englobante.
- [ ] Given une tuile qui dépasse les budgets (§10.4), Then le build échoue avec un message qui nomme la tuile.
- [ ] Given `manifest`, Then `world-manifest.{release}.json` liste les tuiles, leurs hashes, `formatVersion`, l'instantané source et la licence ODbL ; aucun chemin local ni nom de poste (m7).
- [ ] Given le test golden, Then le sha256 du manifeste est stable d'une exécution à l'autre.

## Out of scope
- Façades par modules de kit (J1-03).
- LOD L1+ (J1-09).

## Technical notes
Ajout des dépendances `earcut`, `@gltf-transform/*` et `meshoptimizer` : accord du propriétaire requis. Réf. ADR 0002, ARCHITECTURE §10.3, §11.2 (étapes 14, 16, 17).

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
