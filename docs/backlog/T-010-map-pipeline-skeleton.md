---
id: T-010
title: Create tools/map-pipeline CLI skeleton and retire world-generator
status: done
owner: backend
author_of_code: backend-dev (Claude, for Ky-Wilson)
priority: P0
size: M
---

## Context
`packages/world-generator` mélange des briques utiles (projection, taxonomie de POI) avec du code mort ou bogué (`WorldGenerator`, barrels cassés, scripts de pseudo-tests) (cartographie M6, m12).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-003, T-008.

## User story
En tant que développeur du pipeline, je veux une CLI structurée par étapes afin d'ajouter une étape sans toucher aux autres.

## Acceptance criteria
- [x] Given `tools/map-pipeline`, Then la commande `pnpm map:build --config <fichier>` lit une configuration validée (Zod) et exécute une liste ordonnée d'étapes, chacune dans son module (`src/stages/<nn>-<nom>/`).
- [x] Given une étape, Then elle déclare ses entrées et sorties ; le runner calcule un hash d'entrée et saute l'étape si sa sortie en cache correspond (incrémental, testé).
- [x] Given `packages/world-generator`, Then il est supprimé ; la logique utile est notée dans le journal d'implémentation pour T-011 (taxonomie, parsing).
- [x] Given `tools/map-pipeline/config/fixture.pipeline.json` et `yopougon.pipeline.json` (squelette), Then ils sont validés au démarrage.
- [x] Given le code, Then aucun `Math.random` (règle ESLint) ; un `SeededRng` (graine explicite) est fourni et testé.

## Out of scope
- Implémenter les étapes métier (T-011, T-012, T-022).

## Technical notes
Suppression de `packages/world-generator` : accord du propriétaire requis. Réf. ARCHITECTURE §11, §26.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
- 2026-10-13 — CLI and incremental runner:
  - `pnpm map:build --config <file> [--force]` (root script) → `src/cli/main.ts`; config paths are repository-relative (repo root found via `pnpm-workspace.yaml`).
  - `src/config/`: Zod schema (`commune`, `seed`, `source` = `local-file` | `osm-snapshot`, `boundary.osmRelationId`, `marginM`, `outputDir`), strict, rejects absolute and `\` paths. `config/fixture.pipeline.json` and `config/yopougon.pipeline.json` are validated by tests.
  - `src/runner/`: `PipelineStage` contract (id, version, outputs, inputFiles, params, run); input hash = sha256(id + version + key-sorted params + input contents); skip when the cache record and output hashes match; error when a declared output is missing. Tested: first run, cache hit, upstream change, params/version change, tampered output, `--force`.
  - `src/determinism/seeded-rng.ts`: xmur3 + sfc32, `rngFor(seed, osmId)`; `Math.random` already banned by ESLint.
  - First stage `01-source` (local GeoJSON fixture → `source.geojson` + `source.json` with sha256 and ODbL attribution). `osm-snapshot` fails explicitly until T-022.
- `packages/world-generator` no longer exists (removed in the J0 foundations PR). Its code stays in `tools/map-pipeline/legacy/` as reference until T-011/T-012, then it is deleted.
- Notes for T-011 from the legacy code (`legacy/src/importers/GeoJSONImporter.ts`):
  - Reuse the POI taxonomy maps (`amenity`, `shop`, `tourism`, `leisure`, `office`, `craft`, `healthcare`, `emergency` → categories such as healthcare, education, commerce, service, food, finance, worship).
  - Fix level parsing: legacy uses `parseInt(building:levels)` (breaks on `"2;3"`, `"R+2"`, decimals), clamps to ≥ 1 and uses 3 m per floor; `height` tag is ignored.
  - Legacy ids are `bldg_way_<id>`: switch to stable `osm:{type}/{id}`.
  - MultiPolygon buildings and relations were dropped by the overpass export: handle them in normalize.
- Tests: 21 in the package; `pnpm lint`, `pnpm typecheck`, `pnpm test` green.

## Review
- Reviewed and merged by smartdev1 in PR #4.

## QA report
(filled by the QA agent)
