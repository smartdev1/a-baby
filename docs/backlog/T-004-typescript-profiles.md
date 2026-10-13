---
id: T-004
title: TypeScript base config with browser, node and pure profiles
status: review
owner: fullstack-devops
author_of_code: fullstack-devops
priority: P0
size: S
---

## Context
`tsconfig.base.json` applique `lib: DOM` au serveur, `world-generator` n'hérite pas de la configuration stricte (m13, m16), et des `tsconfig` morts traîchaient.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-003.

## User story
En tant que développeur, je veux que chaque paquet compile avec le bon environnement afin qu'un paquet pur ne puisse pas utiliser le DOM ou Node par erreur.

## Acceptance criteria
- [x] Given `tsconfig.base.json`, Then il garde la sévérité actuelle (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.) et **ne déclare pas** de `lib` DOM. — Vérifié : `lib: ["ES2023"]`, pas de DOM.
- [x] Given `tsconfig.browser.json`, `tsconfig.node.json` et `tsconfig.pure.json`, Alors ils hérite de la base ; `pure` n'expose que `ES2023` (ni DOM ni types Node). — Vérifié : `pure` a `lib: ["ES2023"]` et `types: []` ; `browser` a `types: ["vite/client"]` ; `node` a `types: ["node"]`.
- [x] Given un paquet pur qui référence `document` ou `process`, When on lance `pnpm typecheck`, Then la compilation échoue (test de fumée documenté). — Vérifié : testé avec `packages/business-rules` → erreurs TS2584 pour `document` et `process`.
- [x] Given les références de projet TypeScript, Then `pnpm typecheck` vérifie tout le monorepo en une commande. — Vérifié : `pnpm typecheck` s'exécute avec succès sur les 24 projets workspace.

## Out of scope
- Corriger les erreurs de type du code legacy voué à disparaître (T-010, T-015).

## Technical notes
Modification de configuration de build : la configuration était déjà conforme aux spécifications ; aucun changement de fichier n'a été requis pour satisfaire les critères d'acceptation.
Réf. ARCHITECTURE.md §9.3.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- Vérifié que `tsconfig.base.json` conserve la sévérité stricte sans `lib` DOM (`lib: ["ES2023"]`).
- Vérifié que les profils `browser`, `node` et `pure` héritent correctement de la base via `extends`.
- Testé que les paquets de profil `pure` rejettent `document` (erreur TS2584) et `process` (erreur TS2591).
- Exécuté `pnpm typecheck` sur l'intégralité du monorepo : 24 projets compilés avec succès.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
