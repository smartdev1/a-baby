---
id: T-006
title: Vitest workspace with coverage and fast-check
status: review
owner: backend
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
- [x] Given la configuration Vitest en workspace, When on lance `pnpm test`, Then tous les `*.test.ts` du monorepo s'exécutent, et la commande passe s'il n'y en a aucun dans un paquet.
- [x] Given `pnpm test:coverage`, Then un rapport est produit, avec un seuil de 85 % de lignes appliqué aux paquets purs (configurable par paquet).
- [x] Given fast-check, Then un exemple de test de propriété existe et sert de modèle (`docs/conventions.md`).
- [ ] Given Windows et Linux, Then `pnpm test` passe sur les deux.

## Out of scope
- Écrire les tests des paquets métier (dans les tâches de ces paquets).

## Technical notes
Ajout de dépendances de développement : accord du propriétaire requis. Rôle : `fullstack-qa` écrit, `fullstack-devops` recette.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- PR #2 + T-008/T-010: one Vitest config for the monorepo (`passWithNoTests`), `pnpm test:coverage`, fast-check used as model (see `docs/conventions.md`). 2026-10-13: ≥ 85 % line thresholds on pure packages with code (`geo`, `tile-format`) in `vitest.config.ts`. **Remaining:** Windows run, which the prepared CI (T-007) covers once enabled.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
