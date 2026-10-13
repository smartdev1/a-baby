---
id: T-004
title: TypeScript base config with browser, node and pure profiles
status: done
owner: backend
author_of_code:
priority: P0
size: S
---

## Context
`tsconfig.base.json` applique `lib: DOM` au serveur, `world-generator` n'hérite pas de la configuration stricte (m13, m16), et des `tsconfig` morts traînent.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-003.

## User story
En tant que développeur, je veux que chaque paquet compile avec le bon environnement afin qu'un paquet pur ne puisse pas utiliser le DOM ou Node par erreur.

## Acceptance criteria
- [x] Given `tsconfig.base.json`, Then il garde la sévérité actuelle (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.) et ne déclare plus de `lib` DOM.
- [x] Given `tsconfig.browser.json`, `tsconfig.node.json` et `tsconfig.pure.json`, Then ils héritent de la base ; `pure` n'expose que `ES2023` (ni DOM ni types Node).
- [x] Given un paquet pur qui référence `document` ou `process`, When on lance `pnpm typecheck`, Then la compilation échoue (test de fumée documenté).
- [x] Given les références de projet TypeScript, Then `pnpm typecheck` vérifie tout le monorepo en une commande.

## Out of scope
- Corriger les erreurs de type du code legacy voué à disparaître (T-010, T-015).

## Technical notes
Modification de configuration de build : accord du propriétaire requis. Réf. ARCHITECTURE §9.3.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- Done in PR #2: `tsconfig.base.json` (strict, no DOM) + `browser` / `node` / `pure` profiles; `pnpm typecheck` runs every package. 2026-10-13 smoke test: a pure package using `document` and `process` fails with TS2584 / TS2591 (no project references needed: each package is checked by `pnpm -r typecheck`).

## Review
- Reviewed and merged by smartdev1 in PR #2.

## QA report
(filled by the QA agent)
