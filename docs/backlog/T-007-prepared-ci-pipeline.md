---
id: T-007
title: Prepared CI pipeline (Ubuntu and Windows)
status: todo
owner: fullstack-devops
author_of_code:
priority: P1
size: M
---

## Context
Les règles de qualité doivent être vérifiées à chaque PR. Environnement local uniquement (CLAUDE.md) : la CI est **préparée**, pas activée par les agents.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-005, T-006.

## User story
En tant que propriétaire, je veux un workflow de CI prêt à l'emploi afin de l'activer quand je le déciderai.

## Acceptance criteria
- [ ] Given `.github/workflows/ci.yml`, Then il exécute sur `ubuntu-latest` et `windows-latest` : installation pnpm figée, `lint`, `typecheck`, `test`, `check:folder-size`, `content:validate` (vide en J0) et le test golden du pipeline (dès T-011).
- [ ] Given le workflow, Then il met en cache le store pnpm et ne contient aucun secret.
- [ ] Given le README, Then une section explique comment l'activer et exécuter les mêmes vérifications en local (`pnpm verify`).

## Out of scope
- Activer la CI, pousser sur un dépôt distant, déployer.

## Technical notes
Modification de CI : accord du propriétaire requis. Préparé, jamais exécuté par un agent.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
