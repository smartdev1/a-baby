---
id: T-001
title: Remove debug scripts, compiled artifacts and dead files
status: done
owner: backend
author_of_code:
priority: P0
size: S
---

## Context

Le dépôt contient 10 scripts de debug à la racine (chemins Windows absolus du poste d'Aristide), 15 artefacts `tsc` versionnés, un `.bak`, deux JSON morts et un verrou de session (cartographie §5, m1, m2, m3, m15). Ils polluent le dépôt, induisent en erreur et fuient des informations locales.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : aucune tâche.

## User story

En tant que développeur, je veux un dépôt sans fichiers morts afin de comprendre immédiatement ce qui est réellement utilisé.

## Acceptance criteria

- [x] Given le dépôt actuel, When la tâche est livrée, Then les fichiers suivants n'existent plus : `check_buildings.js`, `check_buildings2.js`, `check_road.js`, `check_road.bat`, `debug_buildings.js`, `debug_roads.js`, `debug_roads2.js`, `test_sector_gen.js`, `test_world_gen.js`, `test_output.txt`, `apps/server/src/index.ts.bak`, `packages/world-generator/scripts/*.js|*.d.ts|*.map` (15 fichiers), `packages/game-config/buildings.json`, `packages/game-config/road-prop-config.json`.
- [x] Given `.claude/scheduled_tasks.lock`, When la tâche est livrée, Then il n'est plus suivi par git et figure dans `.gitignore`.
- [x] Given le nouveau `.gitignore`, Then il ignore `node_modules/`, `dist/`, `data/cache/`, `data/build/`, `*.js.map`, les `*.js` et `*.d.ts` générés à côté des sources TypeScript des paquets, `.env`, `.claude/*.lock`.
- [x] Given un `grep` des chemins `C:\\Users` dans le dépôt (hors `docs/` et `package-lock.json`), Then il ne renvoie plus rien, à l'exception de `packages/game-config/world.json`, traité par T-015.

## Out of scope

- Supprimer `world.json`, `props.json`, `road-network.json` (T-015).
- Toucher à `.claude/settings.json` ou aux agents (décision du propriétaire, Q10).

## Technical notes

Suppression de fichiers : **accord explicite du propriétaire requis** (CLAUDE.md, actions sensibles). Demande groupée unique listant les fichiers. Réversible via git. Réf. ARCHITECTURE §26.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log

- Done in PR #2 (J0 foundations): debug scripts, compiled artifacts, `.bak`, empty/dead config files and `.claude/scheduled_tasks.lock` removed (owner approval 2026-10-13); `.gitignore` rewritten (cache, build, local role).

## Review

- Reviewed and merged by smartdev1 in PR #2.

## QA report

(filled by the QA agent)
