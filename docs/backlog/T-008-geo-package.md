---
id: T-008
title: Create @skyline/geo: UTM 30N projection and fixed tile grid
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
La projection actuelle recentre l'origine à chaque export et `normalizeToBounds` réduit la scène à 300 unités (bug d'échelle C1). ADR 0002 fixe UTM 30N, 1 u = 1 m, une grille fixe pour tout le District et des tuiles de 250 m.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-004.

## User story
En tant que pipeline, client ou serveur, je veux une seule bibliothèque de conversion de coordonnées et de grille afin que tout le monde calcule les mêmes positions et les mêmes tuiles.

## Acceptance criteria
- [ ] Given un point WGS84 dans l'emprise du District d'Abidjan, When je fais l'aller-retour WGS84 → UTM 30N → WGS84, Then l'erreur est < 1 cm (test de propriété, 10 000 tirages).
- [ ] Given 3 points de référence connus (valeurs UTM publiées), Then la conversion est exacte au centimètre.
- [ ] Given une position UTM, Then `tileKeyOf(pos, level)` renvoie `L{level}_{i}_{j}` sur la grille fixe (origine constante, documentée et testée), et `tileBounds(key)` en est l'inverse.
- [ ] Given `cellKeyOf` (4×4 tuiles par défaut), Then une cellule est toujours alignée sur la grille des tuiles.
- [ ] Given `toEngine(posUtm, origin)`, Then le repère est x = est, y = haut, z = nord, en mètres relatifs à l'origine (origine flottante).
- [ ] Given le paquet, Then il est **pur** (profil `pure`), n'a aucune dépendance d'exécution et couvre ≥ 85 % de ses lignes.

## Out of scope
- Projection d'autres zones UTM.
- Le streaming (J1).

## Technical notes
Formules UTM implémentées et testées (ou `proj4` si le propriétaire l'accepte, avec vérification de la licence). Réf. ADR 0002, ARCHITECTURE §10.1.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
