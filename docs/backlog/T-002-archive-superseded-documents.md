---
id: T-002
title: Archive superseded vision documents
status: done
owner: backend
author_of_code:
priority: P1
size: S
---

## Context
La vision « vie virtuelle Yopougon » remplace le CDC v1.1 (ADR 0001). Les documents GTA à la racine (CDC, dossier LD, deux plans d'assets) peuvent tromper un nouvel arrivant ou un agent.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : aucune tâche.

## User story
En tant que membre de l'équipe, je veux que les documents obsolètes soient clairement archivés afin de ne jamais m'appuyer sur une vision abandonnée.

## Acceptance criteria
- [x] Given les 4 fichiers `SKYLINE_*.md`, When la tâche est livrée, Then ils sont déplacés dans `docs/archive/` avec, en tête, un bandeau « SUPERSEDÉ le 13/10/2026 par ARCHITECTURE.md et ADR 0001 ; seules les sections citées par ARCHITECTURE.md restent des références ».
- [x] Given `public-assets/npc_kader_lod0.glb`, When le propriétaire a tranché, Then il est soit supprimé, soit déplacé vers `assets-src/archive/` (décision consignée dans le journal d'implémentation).
- [x] Given ARCHITECTURE.md et docs/adr, Then aucun lien n'est cassé par le déplacement.

## Out of scope
- Réécrire le contenu des documents archivés.

## Technical notes
Déplacement de fichiers : accord du propriétaire requis. Pas de code touché.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- Done in PR #2: CDC v1.1, level design and asset plans moved to `docs/archive/` (with the prototype NPC glb); legacy code in `docs/archive/legacy-code/`.

## Review
- Reviewed and merged by smartdev1 in PR #2.

## QA report
(filled by the QA agent)
