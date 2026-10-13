---
id: T-014
title: Client tile loader v0: render the fixture at 1:1 scale
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
Démonstration de J0 : prouver la chaîne pipeline → tuiles → client à l'échelle réelle, et corriger visiblement le bug d'échelle.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-012, T-013.

## User story
En tant que propriétaire, je veux voir le quartier de la fixture rendu à l'échelle réelle afin de valider la base sur laquelle tout le reste sera construit.

## Acceptance criteria
- [ ] Given un manifeste et des tuiles produits par T-012 et servis en local, When j'ouvre le client, Then toutes les tuiles du manifeste sont chargées (fetch + décodage), puis rendues.
- [ ] Given la scène, Then les bâtiments ont leurs vraies emprises et les rues leur largeur réelle ; une rue résidentielle mesure 6 m ± 0,1 m à l'outil de mesure de debug.
- [ ] Given `WorldRenderer.ts`, Then il est supprimé ; sa logique utile (fusion par matériau, thin instances) est reprise dans `src/world-render/<concept>/` en fichiers de moins de 250 lignes.
- [ ] Given un fichier de tuile invalide, Then il est rejeté avec un log d'erreur et le reste de la scène s'affiche.
- [ ] Given le harness de T-020, Then une mesure de FPS et de temps de chargement de la fixture est consignée comme référence.

## Out of scope
- Streaming dynamique autour du joueur, LOD, cache (J1-07).
- Façades par modules (J1-08).

## Technical notes
Réf. ARCHITECTURE §10.5 (version simplifiée), §26.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
