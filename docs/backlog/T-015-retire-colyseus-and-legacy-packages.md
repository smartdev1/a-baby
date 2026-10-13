---
id: T-015
title: Retire Colyseus server skeleton, contracts, game-config and archive the Prisma schema
status: todo
owner: fullstack-devops
author_of_code:
priority: P1
size: S
---

## Context
ADR 0003 retire Colyseus. Le serveur est un squelette sans salle avec un build cassé (C5) ; `contracts` n'est pas un paquet et contient surtout des types de combat (M5) ; `game-config` contient des données générées et une fuite de chemin local (m7) ; le schéma Prisma est invalide (M4).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-003.

## User story
En tant qu'équipe, je veux retirer ce qui ne sera pas réutilisé tel quel afin d'éviter toute confusion avant la création des nouveaux services.

## Acceptance criteria
- [ ] Given `apps/server`, Then le dossier est supprimé ; l'idée `/health` et l'arrêt propre sont notés pour `apps/services` (journal d'implémentation).
- [ ] Given `packages/contracts`, Then il est supprimé ; les types réutilisables (`Position`, `input`, `interact`, `purchase` avec idempotence, `ping`) sont recopiés dans `docs/archive/contracts-v0.ts.md` pour J1-12.
- [ ] Given `packages/game-config/`, Then il est supprimé (`world.json`, `props.json`, `road-network.json`).
- [ ] Given `prisma/schema.prisma`, Then il est déplacé dans `docs/archive/` (le nouveau schéma arrive en J6-01).
- [ ] Given les scripts racine, Then `pnpm dev` ne lance plus que le client tant que les nouveaux serveurs n'existent pas.

## Out of scope
- Créer `apps/gateway`, `apps/zone` et `apps/services` (J1, J6).

## Technical notes
Suppressions et retrait de dépendances (colyseus, express, @colyseus/monitor, prisma) : **accord du propriétaire requis**, conditionné à l'acceptation de l'ADR 0003 (Q2). Si l'ADR est refusée, la tâche passe en `blocked`.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
