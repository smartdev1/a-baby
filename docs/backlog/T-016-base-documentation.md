---
id: T-016
title: README, .env.example, conventions, context and tech-debt documents
status: done
owner: backend
author_of_code:
priority: P1
size: S
---

## Context
Le README décrit une arborescence inexistante et une vision abandonnée ; `.env.example` contient des variables GTA et une coquille (M10, m14) ; la structure documentaire attendue par CLAUDE.md (`conventions.md`, `context.md`, `tech-debt.md`) n'existe pas.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-003.

## User story
En tant que nouvel arrivant, je veux une documentation d'accueil exacte afin de démarrer en moins d'une heure sous Windows comme sous Linux.

## Acceptance criteria
- [x] Given `README.md`, Then il présente la vision en 5 lignes, les prérequis (Node 24, pnpm, Docker Desktop pour le pipeline), le démarrage pas à pas sous Windows et Linux, les commandes utiles, les liens vers ARCHITECTURE.md, la roadmap et les ADR, et l'attribution OSM.
- [x] Given `.env.example`, Then il ne contient que des variables réellement lues ou prévues en J1 (ports, URL du client), avec des valeurs factices ; les variables GTA et `COLOYSEUS_` sont supprimées.
- [x] Given `docs/conventions.md`, Then il renvoie aux §9 et §27 d'ARCHITECTURE.md sans les dupliquer, et ajoute les exemples d'outillage (lint, tests, fast-check).
- [x] Given `docs/context.md`, Then il résume client, objectifs et contraintes (vision ADR 0001).
- [x] Given `docs/tech-debt.md`, Then il liste les exclusions temporaires de lint (T-005) et la dette connue.
- [x] Given la section « Contexte projet » de `CLAUDE.md`, Then une proposition de nouveau texte est rédigée dans `docs/proposals/claude-md-context.md` pour validation par le propriétaire (CLAUDE.md n'est pas modifié par l'agent).

## Out of scope
- Modifier CLAUDE.md ou les fichiers d'agents.

## Technical notes
Modification de `.env.example` : accord du propriétaire requis (fichier de configuration). Aucun secret.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- PR #2: README (vision, prerequisites, start, commands, links, attribution), `.env.example` (only real variables), `docs/conventions.md`, `docs/tech-debt.md`. 2026-10-13: `docs/context.md` added, tooling examples added to conventions. The CLAUDE.md "Contexte projet" section was rewritten directly with the owner's explicit approval (instead of a proposal file).

## Review
- Reviewed and merged by smartdev1 in PR #2.

## QA report
(filled by the QA agent)
