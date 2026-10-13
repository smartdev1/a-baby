---
id: T-013
title: Client migration to @babylonjs/core, composition root, debug modules, OSM attribution
status: done
owner: frontend
author_of_code:
priority: P0
size: M
---

## Context

Le client utilise le paquet UMD `babylonjs` (bundle lourd, sans tree-shaking), instancie un client Colyseus jamais utilisé et concentre tout dans `main.ts` (cartographie M2, §2.3). ADR 0008.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-004, T-021.

## User story

En tant que joueur, je veux un client léger qui affiche l'attribution OSM ; en tant que développeur, je veux un `main.ts` qui ne fait que composer.

## Acceptance criteria

- [x] Given `apps/web`, Then il dépend de `@babylonjs/core` et `@babylonjs/loaders` ; `babylonjs`, `babylonjs-gui` et `colyseus.js` sont retirés.
- [x] Given `src/app/main.ts`, Then il fait ≤ 60 lignes et ne contient que la composition (moteur, scène, modules) ; la caméra libre est dans `src/debug/fly-camera.ts`, l'overlay FPS dans `src/debug/perf-overlay.ts`, la création du moteur et de la scène dans `src/engine/`.
- [x] Given la caméra de debug, Then elle fonctionne en AZERTY comme en QWERTY (touches physiques), comme aujourd'hui.
- [ ] Given l'écran, Then la mention « © les contributeurs d'OpenStreetMap » avec un lien vers https://www.openstreetmap.org/copyright est visible en permanence (composant `ui/legal/`), avec un texte issu des clés i18n (T-021).
- [ ] Given `vite build`, Then le bundle initial gzip est au moins 50 % plus petit que celui de la version UMD (mesures avant/après dans le journal d'implémentation).
- [x] Given l'import statique de `world.json` et de `props.json`, Then il est supprimé (le monde viendra des tuiles, T-014).

## Out of scope

- Chargement des tuiles (T-014).
- Contrôleur de personnage (J1).

## Technical notes

Ajout et suppression de dépendances : accord du propriétaire requis. `vite.config.ts` est réécrit (accord requis : configuration de build). Réf. ADR 0008, ARCHITECTURE §26.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log

- PR #2 (owner session, before the role split): `@babylonjs/core` + loaders, UMD/GUI/colyseus.js removed, `main.ts` composition only (≤ 60 lines), `debug/fly-camera.ts`, `debug/perf-overlay.ts`, `engine/`, static JSON import removed, OSM attribution visible in `index.html`. **Remaining (frontend):** attribution as an i18n `ui/legal/` component (needs T-021) and the before/after bundle size measurement.

## Review

(filled by tech-lead-po)

## QA report

(filled by the QA agent)
