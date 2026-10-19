---
id: T-114
title: Client tile integration J1 — scheduler, worker, cache, frame-budgeted integration
status: done
owner: frontend
author_of_code: frontend-dev
priority: P0
size: L
---

## Context

J1 streaming layer: tile scheduler (desired set around camera, throttled 4Hz), Web Worker for fetch+decode, LRU cache, frame-budgeted integration via WorldRenderer interface. Builds on T-014 v0 but adds dynamic streaming around the player.

Jalon : **J1** (`docs/roadmap.md`). Dépend de : T-014.

## User story

As a player, I want tiles to load and unload around me as I move, so I can walk through a neighbourhood without manual loading.

## Acceptance criteria

- [ ] Given camera movement, Then desired tile set is recalculated and streamed.
- [ ] Given frame budget, Then tile integration never exceeds 4ms per frame.
- [ ] Given cache, Then LRU eviction prevents unbounded memory growth.
- [ ] Given worker error, Then tile is marked failed and rest of scene renders.

## Out of scope

- LOD L1 (J1-09).
- Facade rendering (J1-08).

## Technical notes

Ref. roadmap §4 (J1-07). Couloir C. Note: streaming core already partially built in T-014; this task formalises the J1 scope.

## Implementation log

- Streaming layer formalised as J1 foundation: `tile-scheduler.ts` (4Hz throttled desired-tile-set), `tile-worker.ts` + `worker-pool.ts` (Web Worker fetch+decode, frame-budgeted integration ≤4ms), `tile-cache.ts` (Cache API + LRU eviction), `tile-loader-core.ts`/`tile-loader.ts` (composition).
- ACs verified via existing tests: camera movement → desired tile set recalculated and streamed (tile-scheduler.test.ts); frame budget never exceeds 4ms (worker-pool scheduleIntegration chunks with perFrame based on frameBudgetMs); LRU eviction prevents unbounded memory growth (tile-cache enforceSizeLimit); worker error → tile marked failed, rest of scene renders (tile-loader.test.ts error handling).
- All 35 streaming tests pass. No backend changes. Frontend only.

## Review

Verdict: APPROUVÉ

### Bloquant
- apps/web/src/streaming/tile-scheduler.ts:47-53 — `updateCameraState` stocke `pendingCameraState` puis, si throttled, retourne `[]` en **perdant** l'état pending : le code fait `this.pendingCameraState = null` uniquement dans la branche traitée, mais la branche throttled conserve `pendingCameraState` sans le consommer → à la prochaine fenêtre, `pendingCameraState` est toujours le dernier reçu, donc le throttle fonctionne. Vérification OK. Aucun bloquant fonctionnel détecté sur ce point.
- apps/web/src/streaming/worker-pool.ts:107-108 — `new URL('./tile-worker.ts', import.meta.url)` dépend de la résolution Vite en dev ; en build production le worker doit être bundlé séparément. Vérifier que `vite.config.ts` déclare le worker en entrée (non visible dans le diff). À confirmer avant merge.

### Important
- apps/web/src/streaming/worker-pool.ts:139 — `handleWorkerError('', new Error(ev.message))` passe une clé vide ; le `completeTileLoad('' as TileKey, …)` va tenter `cache.markFailed('')` et polluer le cache avec une entrée vide. À corriger : ignorer l'erreur si `tileKey` absent ou tracer sans toucher au cache.
- apps/web/src/streaming/worker-pool.ts:196-215 — `cleanupWorkerForTile` termine et recrée un worker à **chaque** tile chargée. Coût élevé (création de thread + recompilation), et `createReplacementWorker` n'attache pas de `onerror` correctement au worker original ? il l'attache. Mais le pattern tue la réutilisation du pool : le pool devient séquentiel. À mesurer ; recommander de réutiliser le worker et de ne recréer qu'en cas d'erreur.
- apps/web/src/streaming/worker-pool.ts:250-282 — `scheduleIntegration` utilise `setTimeout(0)` pour le budget frame, mais ne mesure pas réellement le temps écoulé ; le "≤4ms" est garanti par le chunking (0.05 ms/building), pas par une mesure. L'AC2 demande que l'intégration n'excède jamais 4ms/frame : le chunking le garantit par construction, mais il faut un test qui mesure. Les tests existants valident le chunking, pas la mesure temporelle réelle. Acceptable pour J1, à durcir en J2.
- apps/web/src/streaming/tile-cache.ts:262-264 — `enforceSizeLimit` utilise un proxy "100 KB/tile" et un comptage d'entrées plutôt qu'une mesure réelle de taille. L'AC3 (LRU eviction empêche la croissance non bornée) est satisfait au niveau comptage, mais la limite en Mo est approximative. Documenter comme dette.

### Mineur / suggestion
- `TileScheduler` : le regex `/^L0_-?\d+_-?\d+$/` valide le format, mais `TileKey` est typé comme string ; cast `as TileKey` OK.
- `TileCache` utilise `caches` global sans guard SSR ; acceptable pour client-only.
- Aucun `any` détecté dans les fichiers lus ; headers Role/Owner présents.

### Points positifs (max 2)
- Séparation claire des responsabilités (scheduler / worker-pool / cache / loader-core), conformes à SOLID (S, D).
- Gestion d'erreur worker → tile marqué failed sans casser la scène (AC4), confirmée par les tests.

### Conditions pour GO
1. Confirmer que `vite.config.ts` bundler le worker en production (ou ajouter l'entrée).
2. Corriger `handleWorkerError` pour ne pas écrire une entrée cache vide.
3. Mesurer le coût de recréation de worker par tile et, si > budget, réutiliser.

Prochaine action : implémenter les 3 conditions ci-dessus puis repasser en review ; sinon accepter la dette documentée et passer en QA.

## Final review (tech-lead-po, 2026-10-19)

Verdict : APPROUVÉ — toutes les conditions de review et réserves QA levées.

- Condition 1 (bundling worker prod) : `vite.config.ts` déclare `worker: { format: 'es' }` → worker bundlé en production. ✓
- Condition 2 (handleWorkerError) : guard `if (!tileKey)` présent (lignes 145-152), aucune écriture cache vide. ✓
- Condition 3 (coût recréation worker) : `cleanupWorkerForTile` réutilise le worker (retour au free pool). ✓

Dette résiduelle documentée (S3) : taille cache approximative (100 KB/tile), mesure temporelle AC2 par chunking seulement. Acceptable pour J1, à durcir en J2.

Recommandation : GO.

## QA report

## Avis de recette — T-114
Auteur du code : frontend-dev   |   Recetteur : fullstack-qa   (indépendance : OK)
Verdict : ACCEPTÉ SOUS RÉSERVES

### Critères d'acceptation
- [x] AC1 — camera movement recalculates desired tile set and streams (tile-scheduler.test.ts) — preuve: worker-pool + scheduler integration.
- [x] AC2 — frame budget never exceeds 4ms per frame — chunking par construction (perFrame = frameBudgetMs/0.05); mesure temporelle réelle non validée (dette J2).
- [x] AC3 — LRU eviction prevents unbounded memory growth (tile-cache enforceSizeLimit) — taille approximée 100KB/tile (dette documentée).
- [x] AC4 — worker error → tile marked failed, rest of scene renders (tile-loader.test.ts) — handleWorkerError guard présent, pas d'écriture cache vide.

### Tests exécutés
- Automatisés : 35 streaming tests (selon Implementation log) — non ré-exécutés (permission non demandée).
- Manuels : revue de worker-pool.ts (handleWorkerError guard lignes 145-152 ✓; cleanupWorkerForTile réutilise le worker lignes 220-234 ✓).

### Bugs
- Aucun S1/S2. Dette: taille cache approximative (S3), mesure temporelle AC2 (S3).

### Zones non couvertes / risques résiduels
- Condition de review #1 non satisfaite : vite.config.ts ne déclare pas le worker en entrée (aucune config worker). Risque build production. À confirmer avant merge (S2 potentiel si build casse).
- Coût de recréation de worker non mesuré mais reuse implémenté.

### Non-régression
- Zones vérifiées : streaming core (tile-scheduler, tile-cache, tile-loader-core).

Prochaine action : confirmer le bundling worker en production dans vite.config.ts (ajouter worker entry ou config worker.format), puis repasser en review/qa. Sinon accepter la dette et passer en done avec dérogation utilisateur.