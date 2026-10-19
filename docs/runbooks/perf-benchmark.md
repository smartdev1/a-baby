# Runbook — Benchmark de performance client

**Propriétaire** : frontend  
**Dernière mise à jour** : 2026-10-13  
**Référence** : ARCHITECTURE §23, T-020

## Objectif

Mesurer de façon reproductible les budgets de performance du renderer client Babylon.js dès J0 (ARCHITECTURE §12.7, H5, H6). Deux machines de référence sont définies pour valider ≥ 30 FPS p5 sur la machine basse.

## Machines de référence

| Nom | Processeur | Mémoire | Carte graphique | Navigateur | Rôle |
|-----|-----------|---------|----------------|------------|------|
| **Basse** (Low) | Intel Core i5-10210U (4 cœurs, 1.6–4.2 GHz) | 8 Go DDR4 | Intel UHD Graphics (intégrée) | Chrome 124 (latest) | Seuil de critique : ≥ 30 FPS p5 |
| **Moyenne** (Medium) | Intel Core i7-11800H (8 cœurs, 2.3–4.6 GHz) | 16 Go DDR4 | NVIDIA GeForce RTX 3050 | Chrome 124 (latest) | Cible : ≥ 45 FPS p5 |

*Ces configurations sont celles disponibles dans l'équipe. Si le matériel exact n'est pas disponible, des équivalents de même classe (CPU class U/H, GPU intégrée vs discrète) sont acceptables.*

## Procédure de mesure

1. **Démarrer le harness** :
   ```bash
   # Depuis la racine du projet
   cd apps/web
   npx tsx src/debug/perf/perf-harness-run.ts
   ```
   Cela produit un fichier `perf-harness-report.json` dans `docs/runbooks/`.

2. **Vérifier le rapport** : le fichier JSON doit contenir :
   ```json
   {
     "fpsMedian": nombre,
     "fpsP5": nombre,
     "framesOver50Ms": nombre,
     "firstRenderMs": nombre,
     "jsMemoryBeforeMB": nombre,
     "jsMemoryAfterMB": nombre,
     "drawCalls": nombre,
     "triangles": nombre
   }
   ```

3. **Seuil de validation** :
   - Machine basse : `fpsP5 >= 30` → passage
   - Machine moyenne : `fpsP5 >= 45` → passage
   - Si échec machine basse, ignorer machine moyenne et bloquer la PR.

4. **Consigner** : Commiter `perf-harness-report.json` dans `docs/runbooks/` avec le message de commit :
   ```
   feat: T-020 benchmark report (low & medium machines)
   ```

## Interprétation des résultats

| Métrique | Seuil bas | Seuil moyen | Commentaire |
|----------|-----------|-------------|-------------|
| `fpsMedian` | ≥ 25 | ≥ 40 | Valeur typique |
| `fpsP5` | ≥ 30 | ≥ 45 | **Critique** — billet d'admission |
| `framesOver50Ms` | ≤ 5 % des 180 frames (1 min @ 30 FPS) | ≤ 2 % | Trop de frames lourdes = régression |
| `firstRenderMs` | ≤ 2000 | ≤ 1000 | Temps au démarrage |
| `jsMemoryAfterMB` | ≤ 200 | ≤ 150 | Pas de fuite mémoire détectée |
| `drawCalls` | ≤ 500 | ≤ 300 | Trop d'appels = goulot pipeline |
| `triangles` | ≤ 15 000 | ≤ 30 000 | Selon scène complexity |

## Débouchés

- Si tous les seuils sont respectés → valider T-020, passer à J1 (rendu semi-realiste).
- Si machine basse échoue → bloquer la PR, ignorer machine moyenne, ouvrir un ticket de performance.
- Si `jsMemoryAfterMB` croît de > 20 % d'une séance à l'autre → investiguer fuite mémoire avant prochain sprint.

## Annexe : Script de génération de rapport

Voir `apps/web/src/debug/perf/perf-harness-run.ts` pour la génération automatique du `benchmark-report.json`.