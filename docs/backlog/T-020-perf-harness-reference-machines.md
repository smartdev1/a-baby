---
id: T-020
title: Client performance harness and reference machines
status: todo
owner: fullstack-qa
author_of_code:
priority: P0
size: M
---

## Context
Les budgets (≥ 30 FPS p5 sur la machine basse, temps de chargement, mémoire) doivent être mesurés de façon reproductible dès J0 (ARCHITECTURE §12.7, H5, H6).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-013.

## User story
En tant qu'équipe, je veux une mesure de performance scriptée et reproductible afin de détecter toute régression à chaque PR de rendu.

## Acceptance criteria
- [ ] Given `apps/web/src/debug/perf/`, Then un mode « benchmark » rejoue un parcours de caméra scripté (fichier de parcours versionné) et produit un rapport JSON : FPS médiane et p5, frames > 50 ms, temps de premier rendu, mémoire JS, nombre de draw calls et de triangles.
- [ ] Given `docs/runbooks/perf-benchmark.md`, Then les machines de référence basse et moyenne sont décrites (matériel réel disponible dans l'équipe, sinon équivalents) avec la procédure de mesure.
- [ ] Given la fixture (T-014), Then une première mesure de référence est consignée.

## Out of scope
- Optimiser le rendu (J1+).

## Technical notes
Rôle : `fullstack-qa` écrit, `fullstack-devops` recette. Réf. ARCHITECTURE §23.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
