---
id: T-017
title: ODbL attribution file and licence baseline
status: todo
owner: tech-lead-po
author_of_code:
priority: P0
size: S
---

## Context
Aucune attribution OSM n'existe (C4, critique dès la première diffusion). ADR 0006.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : aucune tâche.

## User story
En tant que projet utilisant OSM, je veux une attribution et une politique de licence claires afin d'être conforme dès le premier partage.

## Acceptance criteria
- [ ] Given `ATTRIBUTION.md`, Then il contient « © les contributeurs d'OpenStreetMap », le lien https://www.openstreetmap.org/copyright, la licence ODbL 1.0, l'identifiant de l'instantané utilisé (renvoi à `data/sources/sources.lock.json`) et une section vide prête pour les autres sources.
- [ ] Given `docs/legal/odbl.md`, Then il décrit la séparation des couches `osm-derived` / `game-authored` et la procédure de publication de la base dérivée (ADR 0006).
- [ ] Given la question de la licence du code (Q9), Then elle est posée au propriétaire ; `LICENSE` n'est créé qu'après sa réponse.
- [ ] Given la mention en jeu, Then elle est couverte par T-013 (vérification croisée en recette).

## Out of scope
- Validation juridique (J7-06).

## Technical notes
Pas de code. Réf. ADR 0006, ARCHITECTURE §21.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
