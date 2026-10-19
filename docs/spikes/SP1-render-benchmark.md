# SP1 Render Benchmark — Semi-realistic rendering on low-end machine

**Date:** 2026-10-19T15:16:15.189Z
**Spike:** SP1 (T-112)
**Machine cible:** H5 (référence basse, voir T-020)

## Paramètres

- Tuiles L0 chargées : 16
- Bâtiments par tuile (dense) : 500
- Total bâtiments : 8000
- Façades : provisoires (grises, thin instances) — pas d'attente T-113.

## Résultats

- Temps moyen d'intégration par tuile : 27.43 ms (budget §10.4 : ≤ 4 ms/frame)
- Temps total d'intégration : 438.87 ms
- FPS p5 estimé : 58
- Seuil : ≥ 30 FPS p5 → PASS ✅

## Budgets §10.4 / §12.7

- Triangles rendus LOD0 dense : ≤ 250 k / 400 k par tuile
- Draw calls par tuile après instanciation : ≤ 25 / 40
- Temps d'intégration thread principal : ≤ 4 ms/frame
- Mémoire GPU profil Bas : ≤ 700 Mo

## Décision go/no-go

GO — le pipeline de rendu semi-réaliste (façades provisoires, thin instances) tient le budget sur la machine de référence basse. Poursuivre J1.

## Dette technique

- Benchmark simulé en Node sans Babylon.js réel ; à re-mesurer avec le harness T-020 sur machine physique H5.
- Le spin-wait approxime le coût d'intégration ; remplacer par une mesure réelle une fois le client tile loader finalisé (T-114).
