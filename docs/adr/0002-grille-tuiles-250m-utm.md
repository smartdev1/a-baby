# ADR 0002 — Grille de tuiles de 250 m en UTM 30N, hiérarchie de LOD, cellules distinctes des tuiles

- **Statut** : Proposée
- **Date** : 13/10/2026

## Contexte

Yopougon couvre environ 153 km² et compte de l'ordre de 10⁵ bâtiments. L'existant charge un `world.json` monolithique dans le bundle, avec une projection recentrée à chaque export et une normalisation à 300 unités qui déforme la scène (×0,25 en plan, ×1 en hauteur). Il faut un découpage spatial stable, extensible à tout Abidjan, utilisable à la fois pour le streaming client et pour les collisions serveur.

## Décision

1. **Projection unique** : UTM zone 30N (EPSG:32630), 1 unité = 1 m, sans aucune normalisation. Grille d'origine **fixe**, arrondie au kilomètre au sud-ouest du District d'Abidjan.
2. **Tuile L0 = 250 m × 250 m** (environ 2 500 tuiles pour Yopougon), puis des niveaux agrégés L1 = 500 m, L2 = 1 km et L3 = 2 km pour les LOD lointains.
3. Fichiers par tuile : `geom` (glb meshopt), `instances` (listes d'instances de modules de kit), `collision` (2,5D, partagé client et serveur), `meta` (JSON validé), `nav` ; noms adressés par hash ; manifeste-index par release.
4. Budgets bloquants par tuile (≤ 600 Ko en moyenne, ≤ 1,5 Mo au maximum compressé, etc.) : le build échoue en cas de dépassement.
5. **Cellule serveur ≠ tuile** : la cellule (unité d'autorité) regroupe par défaut 4×4 tuiles (1 km²), et peut être scindée jusqu'à une tuile, toujours alignée sur la grille.
6. Côté client, **origine flottante** : les sommets sont stockés en coordonnées locales à la tuile.

## Alternatives écartées

| Option                                                | Raison du rejet                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Tuiles de 100 m                                       | ≈ 15 000 fichiers, surcoût de requêtes et de gestion, LOD plus complexes                                    |
| Tuiles de 500 m ou 1 km en L0                         | Tuiles lourdes (plusieurs Mo), streaming grossier, pics de chargement                                       |
| Quadtree adaptatif (taille variable selon la densité) | Complexité de génération et d'adressage sans gain mesuré à ce stade                                         |
| OGC 3D Tiles                                          | Pas de chargeur Babylon natif mature au moment du choix (à revérifier) ; format plus général que nécessaire |
| Équirectangulaire locale par export (existant)        | Origine instable, identifiants de tuiles non stables entre communes                                         |

## Conséquences

- Les identifiants de tuiles sont stables pour tout le District : ajouter une commune n'en renumérote aucune.
- Le client ne télécharge que ce qui est proche ; les kits de modules sont communs à toutes les tuiles.
- Le serveur charge les collisions de ses cellules (et une marge) à partir des **mêmes fichiers** que le client.
- La taille de 250 m est à confirmer par les mesures du spike SP1 (révisable à 200 ou 300 m sans changer l'architecture).
