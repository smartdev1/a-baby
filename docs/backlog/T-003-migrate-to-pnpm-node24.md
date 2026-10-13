---
id: T-003
title: Migrate to pnpm workspaces and Node 24 LTS, single lockfile
status: done
owner: backend
author_of_code:
priority: P0
size: M
---

## Context

Le dépôt a deux lockfiles npm, une dépendance par chemin mal nommée (`world-generator`), des doublons de configuration (`config/`) et des dépendances fantômes (cartographie m4, m5). ADR 0007 retient pnpm pour son `node_modules` strict.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-001.

## User story

En tant que développeur sous Windows ou Linux, je veux installer le projet en une commande avec un lockfile unique afin d'avoir le même environnement que mes collègues.

## Acceptance criteria

- [x] Given un clone propre sous Windows 11 et sous Linux, When je lance `pnpm install`, Then l'installation réussit avec un seul `pnpm-lock.yaml`, et `package-lock.json` ainsi que `apps/web/package-lock.json` n'existent plus.
- [x] Given `pnpm-workspace.yaml`, Then il déclare `apps/*`, `packages/*` et `tools/*`.
- [x] Given le `package.json` racine, Then il contient `engines.node >= 24`, `packageManager` (pnpm figé), la description « vie virtuelle 3D web — Yopougon », et uniquement des scripts racine (`lint`, `typecheck`, `test`, `dev`).
- [x] Given `config/prisma/schema.prisma`, `config/typescript/*.json` et `config/vite/web.config.ts`, Then ils sont supprimés (doublons morts).
- [x] Given `apps/web/package.json`, Then la dépendance par chemin `world-generator` et `vite-plugin-babel-macros` sont retirées.
- [x] Given un `.nvmrc` ou équivalent, Then il fixe Node 24.

## Out of scope

- Migrer Babylon (T-013).
- Créer les nouveaux paquets (T-008 et suivants).

## Technical notes

Ajout et suppression de dépendances, modification de la configuration de build : **accord du propriétaire requis**. Scripts multiplateformes (pas de syntaxe bash). Réf. ADR 0007.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log

- Done in PR #2: pnpm workspaces (`apps/*`, `packages/*`, `tools/*`), single `pnpm-lock.yaml`, `engines.node >= 24`, `packageManager`, `.nvmrc`, `config/` duplicates and both npm lockfiles removed, web path dependency removed.

## Review

- Reviewed and merged by smartdev1 in PR #2.

## QA report

(filled by the QA agent)
