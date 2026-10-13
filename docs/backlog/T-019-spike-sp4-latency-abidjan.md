---
id: T-019
title: Spike SP4: network latency from Abidjan to candidate regions
status: blocked
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P1
size: S
---

## Context
Le choix de la région d'hébergement (et la question ARTCI des transferts hors de Côte d'Ivoire) dépend de mesures réelles depuis les réseaux des joueurs (Q7, ARCHITECTURE §6.4).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : aucune tâche.

## User story
En tant que propriétaire, je veux connaître la latence réelle depuis Abidjan afin de choisir l'hébergement sur des faits.

## Acceptance criteria
- [ ] Given une page de mesure statique (WebSocket echo vers 3 à 5 régions candidates : Europe de l'Ouest, Lagos, Johannesburg…) et un protocole de test, Then le rapport `docs/spikes/SP4-latency.md` donne RTT p50, p95 et gigue par opérateur (Orange, MTN, Moov), par type d'accès (4G, fixe) et par région, sur au moins 3 créneaux horaires.
- [ ] Given les résultats, Then le rapport recommande une région et signale les implications ARTCI d'un hébergement hors de Côte d'Ivoire.

## Out of scope
- Choisir un hébergeur ou engager une dépense.

## Technical notes
Les mesures nécessitent des testeurs à Abidjan (propriétaire) et éventuellement des instances temporaires (dépense) : **accord du propriétaire requis**. Aucun déploiement par un agent : le kit de mesure est préparé, le propriétaire l'exécute.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- 2026-10-13 — Measurement kit ready (no deployment, no spending by the agent):
  - `tools/latency-probe/`: WebSocket echo server (serves the page, echoes ≤ 256-byte messages, no storage), French mobile-friendly probe page (300 pings per region, p50 / p95 / jitter / loss, JSON export), shared stats module, aggregator producing the SP4 table; 3 unit tests; end-to-end run checked locally with Playwright (p50 1.5 ms, 0 % loss on localhost).
  - `infra/docker/latency-echo/Dockerfile` (prepared, never executed by an agent).
  - `docs/spikes/SP4-latency.md`: candidate regions, protocol (testers per operator, 3 time slots, 2 days), decision rule (evening p95 ≤ 150 ms), ARTCI implications (law 2013-450), empty results table.
- **Blocked on the owner**: deploy 3–4 temporary instances, recruit testers in Abidjan (Orange, MTN, Moov, fixed), collect the JSON files, then fill the results and the recommendation.

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
