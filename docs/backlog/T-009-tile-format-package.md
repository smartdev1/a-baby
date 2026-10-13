---
id: T-009
title: Create @skyline/tile-format v0: meta and manifest schemas, collision codec
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
Client et serveur doivent lire les mêmes fichiers de tuile (ARCHITECTURE §10.3). Un format non versionné ou non validé rendrait le streaming et les collisions fragiles.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-008.

## User story
En tant que client ou serveur de zone, je veux un format de tuile versionné et validé afin de charger une tuile sans risque d'incohérence.

## Acceptance criteria
- [ ] Given les schémas Zod `TileMeta` v0 (bâtiments : id OSM, type, niveaux, hauteur, `heightSource` ; lieux : id, catégorie, nom affiché ; voisins) et `WorldManifest` (clé → hashes, bbox, `formatVersion`, `sourceSnapshot`, `licence`), Then un JSON invalide est rejeté avec un chemin d'erreur lisible.
- [ ] Given le codec `collision.bin` v0 (en-tête versionné, champ de hauteur, prismes : anneau 2D + base + sommet), When j'encode puis décode des données aléatoires, Then j'obtiens les mêmes données (test de propriété).
- [ ] Given un `collision.bin` tronqué ou avec des longueurs incohérentes, Then le décodeur lève une erreur typée, sans plantage ni lecture hors limites (fuzz, 10 000 entrées).
- [ ] Given les conventions de nommage `tiles/L0/{i}_{j}/<kind>.{hash}.<ext>`, Then elles sont exposées par des fonctions, pas des chaînes recopiées.
- [ ] Given le paquet, Then il est pur et ne dépend que de `zod` et `@skyline/geo`.

## Out of scope
- Format `instances.bin` et `nav.bin` (J1).
- LOD L1 à L3 (J1, J2).

## Technical notes
Réf. ADR 0002, ARCHITECTURE §10.3, §10.4.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
