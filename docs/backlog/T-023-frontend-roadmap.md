---
id: T-023
title: Frontend Design Roadmap — Vie Virtuelle Yopougon
status: done
owner: frontend-dev
priority: P0
size: L
---

## Context

Le projet SKYLINE a basculé sur une nouvelle vision "vie virtuelle Yopougon" (ADR 0001) remplaçant leCDC v1.1. Le développeur principal a rôle **frontend-only** (CLAUDE.md) : aucune modification backend n'est effectuée. La valeur frontend est de rendre le monde OSM 150 km² explorable dans le navigateur avec @babylonjs/core, ≥30 FPS machine basse, attribution OSM conforme. La roadmap est décomposée en 5 phases (S1→S5) s'étalant sur J0→J1, avec des dépendances chaîne critiques T-001→T-003→T-004→(T-005|T-006|T-021)→T-007→T-008→T-009→T-010→T-011→T-012→T-013→T-014→T-020→T-021.

## User story

En tant que développeur frontend, je veux un client 3D léger qui permet au joueur d'explorer la commune de Yopougon à l'échelle réelle 1:1 dans son navigateur, avec une performance fluide (≥30 FPS sur machine basse), une attribution OpenStreetMap conforme, et une interface en français/nouchi — afin que le joueur puisse vivre une vie quotidienne normale (travail, maquis, commerce, logement) sans technique barrier.

## Acceptance criteria

- [ ] Given le dépôt propre avec `echo frontend > .claude/role.local`, When `pnpm install` réussit, Then tous les paquets s'installent sans dépendance backend (pas de `world-generator`, pas de `colyseus`, pas de `packages/contracts` en dépendances runtime).
- [ ] Given `pnpm typecheck`, Then la compilation passe sur tous les paquets frontend (browser/pure profiles) sans erreur DOM/Node dans les packages purs.
- [ ] Given `pnpm lint`, Alors aucune violation de règles FRONTEND.md (max-lines 400, pas de noms `utils|helpers|common`, en-tête `Role:` présent).
- [ ] Given `pnpm dev`, Alors le monde 3D Yopougon s'affiche, le joueur peut se déplacer (ZQSD/AZERTY), la caméra tourne, et l'attribution "© les contributeurs d'OpenStreetMap" est visible en permanence.
- [ ] Given T-013 menée à bien, Alors `main.ts` fait ≤ 60 lignes ne contenant que la composition (moteur, scène, modules) ; la caméra libre est dans `src/debug/fly-camera.ts`, l'overlay FPS dans `src/debug/perf-overlay.ts`, la création du moteur et de la scène dans `src/engine/`.
- [ ] Given T-014 menée à bien, Alors le monde 150 km² est chargable dynamiquement via tuiles (pas de `world.json`/`.props.json` en import statique) ; les bâtiments ont leur vraie forme (pas de boîtes).
- [ ] Given T-020 menée à bien, Alors le mode « benchmark » rejoue un parcours de caméra scripté et produit un rapport JSON : FPS médiane ≥ 30 p5, frames > 50 ms comptabilisées, temps premier rendu consigné, mémoire JS stable, draw calls et triangles dans les budgets.
- [ ] Given T-021 menée à bien, Alors le composant `ui/legal/` affiche l'attribution OSM avec clés i18n français/nouchi ; les textes des dialogues/NPC utilisent les clés i18n chargées.

## Out of scope

- Aucune modification ou développement côté serveur (pas de `apps/server/`, pas de `packages/contracts/`, pas de Prisma schema, pas de NATS, pas de Colyseus).
- Pas de calculs de dégâts, d'économie Djai, de règles de combat ou de progression de mission — ceux-ci sont en v2 uniquement (ADR 0001 §3.6).
- Pas de système de véhicules conduisibles dans le MVP.
- Pas de police ou de système de poursuite.
- Pas de création d'assets 3D par external artist — les assets sont générés/interne mais pas dans ce périmètre de story.

## Technical notes

**Frontend-only constraints (CLAUDE.md rôle) :**

- `CLAUDE.md` ne sera **jamais pushé** vers le dépôt git — c'est une règle de référence locale uniquement.
- Le développeur lit `docs/rules/FRONTEND.md` et ne travaille que dans le périmètre frontend.
- Le hook `.claude/hooks/enforce-role.mjs` bloque toute modification hors périmètre (`.claude/ownership.json`).
- Sans rôle déclaré (`SKYLINE_ROLE=owner`), aucune restriction (session du propriétaire).
- Agents dédiés : `frontend-dev` (`.claude/agents/`). Skills du projet : `new-module`, `babylon-rendering`, `3d-asset-pipeline`.
- `.claude/settings.json` interdit la lecture des fichiers `.env`.

**Dépendance chaîne critique :**
T-001 (cleanup, no deps) → T-003 (pnpm migrate, dep T-001) → T-004 (TS config, dep T-003) → T-005/E-006/T-021 (parallèles, attendent T-004) → T-007 (CI, dep T-005 + T-006) → T-008 (geo package, dep T-004) → T-009 (tile-format, dep T-008) → T-010 (pipeline CLI, dep T-003 + T-008) → T-011/T-012 (pipeline stages, dep T-010) → **T-013 (Babylon.js migration, _clé du frontend_, dep T-004 + T-021) → T-014 (tile loader, dep T-012 + T-013) → T-020 (perf harness, dep T-013) → T-021 (i18n foundation, dep T-004).

**Compilation de vérification à chaque étape :**

- `pnpm typecheck` doit passer sur les paquets `pure` (pas de DOM/Node) et `browser` (DOM autorisé).
- `pnpm lint` doit passer sans erreur sur tout code frontend modifié.
- `pnpm test` doit s'exécuter sans échec (même si aucun test de rendu 3D encore).
- Le bundle `vite build` doit être **≥ 50 % plus petit** que l'ancienne UMD `babylonjs` (mesure Phase 2).

**Fichiers de référence :**

- `ARCHITECTURE.md` §10 (monde géographique), §11 (pipeline), §12 (rendu), §26 (existing→devenir)
- `docs/roadmap.md` — jolons J0→J7, chemin critique
- `docs/adr/` — toutes les ADR 0001→0012 s'appliquent
- `docs/rules/FRONTEND.md` — règles de codage/frontend appliquées par `pnpm lint`
- `CLAUDE.md` — rôle frontend-only, interdiction push CLAUDE.md

## Implementation log

(filled by the implementer)

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
