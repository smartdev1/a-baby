---
id: T-012
title: Pipeline stages tile-cut, encode and manifest on the fixture
status: done
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: L
---

## Context
Le client doit charger des tuiles et non plus un JSON statique. Les bâtiments doivent être triangulés hors ligne (earcut) pour corriger le repli en boîtes englobantes (M1).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-009, T-011.

## User story
En tant que client, je veux des tuiles L0 compactes et triangulées afin d'afficher les vraies formes des bâtiments à l'échelle 1:1.

## Acceptance criteria
- [x] Given les sorties de T-011, When `tile-cut` s'exécute, Then chaque objet est affecté aux tuiles L0 qu'il recouvre (polygones et polylignes coupés aux bords) ; les métadonnées vont à la tuile de son centroïde.
- [x] Given `encode`, Then chaque tuile produit `geom.{hash}.glb` (bâtiments extrudés triangulés par earcut, toits plats, rubans de routes à la largeur réelle par classe, sommets locaux à la tuile, meshopt), `collision.{hash}.bin` et `meta.{hash}.json`, validés par `@skyline/tile-format`.
- [x] Given un bâtiment en L ou en U de la fixture, Then sa géométrie suit l'emprise réelle (écart < 0,05 m), sans boîte englobante.
- [x] Given une tuile qui dépasse les budgets (§10.4), Then le build échoue avec un message qui nomme la tuile.
- [x] Given `manifest`, Then `world-manifest.{release}.json` liste les tuiles, leurs hashes, `formatVersion`, l'instantané source et la licence ODbL ; aucun chemin local ni nom de poste (m7).
- [x] Given le test golden, Then le sha256 du manifeste est stable d'une exécution à l'autre.

## Out of scope
- Façades par modules de kit (J1-03).
- LOD L1+ (J1-09).

## Technical notes
Ajout des dépendances `earcut`, `@gltf-transform/*` et `meshoptimizer` : accord du propriétaire requis. Réf. ADR 0002, ARCHITECTURE §10.3, §11.2 (étapes 14, 16, 17).

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- 2026-10-13 — Stages `14-tile-cut`, `16-encode`, `17-manifest`:
  - Cut: buildings clipped with polygon-clipping only when they cross a border (geometry in every covered tile, attributes in the tile of the representative point); roads clipped with Liang–Barsky; places in their tile; local metres (cm).
  - Encode: `geom.glb` (ground, road and path ribbons at real class widths, earcut flat roofs with holes, outward walls without artificial border walls; quantized + meshopt), `collision.bin` v0 (flat ground, one prism per polygon), `meta.json` (validated by `parseTileMeta`); 16-hex content hashes; §10.4 budgets with tile-named errors.
  - Manifest: `world-manifest.{commune}-{date}.json` validated by `parseWorldManifest` (hashes, UTM bbox, snapshot, ODbL), no local path.
- Runner: `outputs` may depend on the config; optional `extraOutputsPresent` (encode checks every indexed tile file).
- Bug fixed in `@skyline/tile-format` (T-009): `GrowableWriter` single writes used the old DataView when a write triggered a buffer growth (found by encoding real tiles); regression test added.
- Measures: L-shaped footprint kept vertex for vertex (unit test); geometry error after quantization ≤ 1.3 cm on real Yopougon tiles; Yopougon: 2 901 tiles, 38.7 MB, avg 13.7 KB, max 119 KB / 4 501 triangles; full stages 14–17 in 14 s. Golden hashes extended to tiles, index and manifest.
- Not done (out of scope): facade kits (J1-03), LOD L1+ (J1-09), relief / water, display names (naming stage).

## Review
- Reviewed and merged by smartdev1 in PR #5.

## QA report
(filled by the QA agent)
