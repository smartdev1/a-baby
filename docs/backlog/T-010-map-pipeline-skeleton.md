---
id: T-010
title: Create tools/map-pipeline CLI skeleton and retire world-generator
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
`packages/world-generator` mélange des briques utiles (projection, taxonomie de POI) avec du code mort ou bogué (`WorldGenerator`, barrels cassés, scripts de pseudo-tests) (cartographie M6, m12).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-003, T-008.

## User story
En tant que développeur du pipeline, je veux une CLI structurée par étapes afin d'ajouter une étape sans toucher aux autres.

## Acceptance criteria
- [ ] Given `tools/map-pipeline`, Then la commande `pnpm map:build --config <fichier>` lit une configuration validée (Zod) et exécute une liste ordonnée d'étapes, chacune dans son module (`src/stages/<nn>-<nom>/`).
- [ ] Given une étape, Then elle déclare ses entrées et sorties ; le runner calcule un hash d'entrée et saute l'étape si sa sortie en cache correspond (incrémental, testé).
- [ ] Given `packages/world-generator`, Then il est supprimé ; la logique utile est notée dans le journal d'implémentation pour T-011 (taxonomie, parsing).
- [ ] Given `tools/map-pipeline/config/fixture.pipeline.json` et `yopougon.pipeline.json` (squelette), Then ils sont validés au démarrage.
- [ ] Given le code, Then aucun `Math.random` (règle ESLint) ; un `SeededRng` (graine explicite) est fourni et testé.

## Out of scope
- Implémenter les étapes métier (T-011, T-012, T-022).

## Technical notes
Suppression de `packages/world-generator` : accord du propriétaire requis. Réf. ARCHITECTURE §11, §26.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
