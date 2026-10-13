# ADR 0006 — Conformité ODbL : attribution, séparation des couches, publication de la base dérivée

- **Statut** : Proposée (validation juridique à obtenir avant la bêta publique, Q8)
- **Date** : 13/10/2026

## Contexte

Le monde est généré depuis OpenStreetMap, sous licence **ODbL 1.0**. Les tuiles (géométrie, hauteurs heuristiques, graphe routier, noms affichés) forment une **base de données dérivée**, et le jeu un **produit dérivé** utilisé publiquement. L'existant ne contient aucune attribution (cartographie, C4) et laisse fuir un chemin local dans `world.json`.

## Décision

1. **Attribution** « © les contributeurs d'OpenStreetMap » avec un lien vers `https://www.openstreetmap.org/copyright` : sur l'écran de chargement, dans les crédits, sur la carte en jeu et dans `ATTRIBUTION.md`. Elle est **bloquante** : le client ne peut pas être livré sans.
2. **Deux couches jamais fusionnées dans une même table** :
   - `osm-derived` (ODbL) : emprises, hauteurs (dont heuristiques), routes, graphe, eau, POI, arrêts, géométrie des sites, noms affichés produits par l'étape `naming` ;
   - `game-authored` (propriétaire) : `content/**` (fiches d'actions, métiers, lignes, prix, gabarits, tables de parodie et de surcharges), assets 3D.
   Le contenu de jeu **référence** des identifiants OSM sans les copier.
3. **Publication** à chaque release publique : archive de la couche `osm-derived` sous ODbL, avec la description du pipeline et l'identifiant de l'instantané OSM (`sources.lock.json`).
4. **Toute autre source** (MNT, jeux d'emprises issus d'imagerie) est déclarée dans `sources.lock.json` et `ATTRIBUTION.md` avec sa licence, et validée **avant** d'être mélangée aux données OSM.
5. Aucune donnée locale (chemin, nom de poste) dans les artefacts générés.

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| Ne rien publier, en invoquant le « produit dérivé » seul | Une base dérivée utilisée publiquement doit être proposée sous ODbL (ou ses modifications) ; risque de non-conformité |
| Publier toute la base du jeu sous ODbL | Inutile, et contaminerait le contenu propriétaire |
| Données hors OSM uniquement | Aucune source ouverte équivalente pour Yopougon |

## Conséquences

- Les concurrents peuvent réutiliser la couche `osm-derived` : c'est le prix de la donnée ouverte. La valeur du jeu réside dans le contenu, le gameplay et l'art.
- Le pipeline produit l'archive ODbL automatiquement (étape `manifest-attribution`).
- La revue de chaque PR qui touche au pipeline vérifie la séparation des couches.
