---
id: T-018
title: Spike SP2: OSM coverage audit of Yopougon
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
Le pipeline à l'échelle de la commune (J2) dépend de la qualité d'OSM à Yopougon : limite administrative, bâti, hauteurs, routes, lignes de transport. Il faut le mesurer avant d'engager J2 (roadmap §3.2).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-022.

## User story
En tant que propriétaire, je veux un état chiffré de la couverture OSM de Yopougon afin de décider des sources complémentaires et du quartier pilote.

## Acceptance criteria
- [ ] Given l'extraction de T-022, Then le rapport `docs/spikes/SP2-osm-coverage.md` donne : l'identifiant de la relation administrative de Yopougon (et son `admin_level`), la surface couverte, le nombre de bâtiments, le % avec `height` ou `building:levels`, le kilométrage de routes par classe, le nombre de POI par catégorie, les relations `route=bus` présentes, et une carte (image) de la densité de bâti par tuile de 250 m mettant en évidence les trous.
- [ ] Given la fixture actuelle (secteur « Pigeons »), Then le rapport confirme ou infirme qu'elle est dans Yopougon (Q3).
- [ ] Given les résultats, Then le rapport recommande : les sources complémentaires éventuelles (avec leur licence), 2 ou 3 candidats de quartier pilote pour J1 et les profils de quartiers à créer.
- [ ] Given les scripts d'analyse, Then ils sont dans `tools/map-pipeline/src/stages/18-report/` ou dans un script réutilisable, pas des fichiers jetables à la racine.

## Out of scope
- Corriger les données OSM.
- Construire les profils de quartiers (J2-03).

## Technical notes
Téléchargement de l'instantané Geofabrik (action réseau externe) : accord du propriétaire requis. Réf. ARCHITECTURE §11.3, §21.3.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
