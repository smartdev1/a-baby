---
id: T-006
title: Vitest workspace with coverage and fast-check
status: todo
owner: fullstack-qa
author_of_code:
priority: P0
size: S
---

## Context
`npm test` échoue faute de fichiers de test ; il n'existe aucun test (cartographie M8). Les paquets purs (geo, tile-format) doivent être testés dès leur création.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-004.

## User story
En tant qu'équipe, je veux une commande de test unique qui couvre tout le monorepo afin de vérifier chaque PR de la même façon.

## Acceptance criteria
- [ ] Given la configuration Vitest en workspace, When on lance `pnpm test`, Then tous les `*.test.ts` du monorepo s'exécutent, et la commande passe s'il n'y en a aucun dans un paquet.
- [ ] Given `pnpm test:coverage`, Then un rapport est produit, avec un seuil de 85 % de lignes appliqué aux paquets purs (configurable par paquet).
- [ ] Given fast-check, Then un exemple de test de propriété existe et sert de modèle (`docs/conventions.md`).
- [ ] Given Windows et Linux, Then `pnpm test` passe sur les deux.

## Out of scope
- Écrire les tests des paquets métier (dans les tâches de ces paquets).

## Technical notes
Ajout de dépendances de développement : accord du propriétaire requis. Rôle : `fullstack-qa` écrit, `fullstack-devops` recette.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
