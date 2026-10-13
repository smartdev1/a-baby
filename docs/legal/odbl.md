# ODbL — séparation des couches et publication

> Résumé opérationnel de l'ADR 0006. Ce document n'est pas un avis juridique ; validation par un juriste avant la bêta publique (Q8).

## Couches

| Couche          | Contenu                                                                                                                                                                | Licence                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `osm-derived`   | Tout ce que le pipeline calcule à partir d'OSM : emprises, hauteurs (OSM ou heuristiques), voies, lieux et catégories, tuiles (`geom`, `collision`, `meta`), manifeste | **ODbL 1.0** (base dérivée)                                                                       |
| `game-authored` | Contenu écrit par l'équipe : `content/` (actions, métiers, objets, dialogues, parodies de marques…), assets 3D, code                                                   | Propriétaire (licence du code : Q9) — peut **référencer** des identifiants OSM sans les fusionner |

Règle : les deux couches ne sont jamais fusionnées dans un même fichier distribué ; une tuile ne contient que de l'`osm-derived`, le contenu de jeu la référence par identifiant `osm:{type}/{id}`.

## Attribution

« © les contributeurs d'OpenStreetMap » + lien https://www.openstreetmap.org/copyright : écran de chargement, carte, crédits, `ATTRIBUTION.md`. Déjà affichée dans le client (coin bas droit).

## Publication de la base dérivée (quand le jeu est distribué publiquement)

1. Archiver la sortie du pipeline d'une release (`16-encode/tiles/` + `17-manifest/world-manifest.<release>.json`) et la configuration (`tools/map-pipeline/config/`, `data/sources/sources.lock.json`).
2. La publier sous ODbL avec l'attribution OSM (dépôt public ou téléchargement), ou publier la méthode de reproduction exacte (le pipeline est déterministe : même instantané + même configuration ⇒ mêmes octets).
3. Mentionner le lien de publication dans les crédits.
