---
id: T-018
title: Spike SP2: OSM coverage audit of Yopougon
status: done
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context
Le pipeline à l'échelle de la commune (J2) dépend de la qualité d'OSM à Yopougon : limite administrative, bâti, hauteurs, routes, lignes de transport. Il faut le mesurer avant d'engager J2 (roadmap §3.2).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-022.

## User story
En tant que propriétaire, je veux un état chiffré de la couverture OSM de Yopougon afin de décider des sources complémentaires et du quartier pilote.

## Acceptance criteria
- [x] Given l'extraction de T-022, Then le rapport `docs/spikes/SP2-osm-coverage.md` donne : l'identifiant de la relation administrative de Yopougon (et son `admin_level`), la surface couverte, le nombre de bâtiments, le % avec `height` ou `building:levels`, le kilométrage de routes par classe, le nombre de POI par catégorie, les relations `route=bus` présentes, et une carte (image) de la densité de bâti par tuile de 250 m mettant en évidence les trous.
- [x] Given la fixture actuelle (secteur « Pigeons »), Then le rapport confirme ou infirme qu'elle est dans Yopougon (Q3).
- [x] Given les résultats, Then le rapport recommande : les sources complémentaires éventuelles (avec leur licence), 2 ou 3 candidats de quartier pilote pour J1 et les profils de quartiers à créer.
- [x] Given les scripts d'analyse, Then ils sont dans `tools/map-pipeline/src/stages/18-report/` ou dans un script réutilisable, pas des fichiers jetables à la racine.

## Out of scope
- Corriger les données OSM.
- Construire les profils de quartiers (J2-03).

## Technical notes
Téléchargement de l'instantané Geofabrik (action réseau externe) : accord du propriétaire requis. Réf. ARCHITECTURE §11.3, §21.3.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- 2026-10-13 — Report: `docs/spikes/SP2-osm-coverage.md` (+ `SP2-building-density.svg`).
  - Yopougon = relation `r3377881` (`admin_level=8`), 149.8 km²; fixture "Pigeons" confirmed inside the commune.
  - 62 496 buildings, 1.3 % with levels, 0.02 % with height; 1 413 km of roads; 13 944 POIs (76.7 % named); 678 route relations incl. gbaka / woro-woro of Yopougon; 1 225 stops.
  - Pilot candidates: Selmer–Sicogi–Score (recommended), Quartier Maroc–Cité Élisée, Port-Bouët II–Ananeraie.
- Code (reusable, no throw-away scripts): new stage `18-report` (stats, land-cover classification of empty tiles, bus routes via osmium OPL, SVG density map, Markdown); `02-extract` now extracts by the boundary relation (bbox of the polygon + margin) and writes `boundary.geojson`; `geometry/geojson-geometry.ts` (area, length, point-in-polygon).
- Relation id stored in `sources.lock.json` and `yopougon.pipeline.json`.
- Tests: 41 in the package.

## Review
- Reviewed and merged by smartdev1 in PR #5.

## QA report
(filled by the QA agent)
