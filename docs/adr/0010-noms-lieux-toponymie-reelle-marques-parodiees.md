# ADR 0010 — Noms de lieux : toponymie réelle, marques et commerces parodiés de façon déterministe

- **Statut** : Acceptée (propriétaire, 13/10/2026). Elle remplace une décision antérieure d'afficher les noms OSM bruts
- **Réserve de l'architecte** : consignée ci-dessous

## Contexte

OSM fournit les noms réels des rues, quartiers et lieux publics, mais aussi ceux des commerces et des marques (« Pharmacie Assonvon », « Maquis le Tropical », kiosques « Orange Money », « MTN »…). Les afficher tels quels expose à des risques de droit des marques, d'atteinte à la réputation et de réclamations de commerçants. Le propriétaire a choisi le modèle des parodies de GTA.

## Décision

1. **Toponymie et lieux publics** (rues, quartiers, marchés, écoles, lieux de culte, administrations, hôpitaux) : **nom réel** issu d'OSM.
2. **Marques et commerces** : **nom déformé**.
   - **Grandes marques** : table de correspondance **manuelle** `content/place-names/brand-parodies.json` (ex. « Orange » → « Oronge », « MTN » → « MTM »), **revue par un humain** (le propriétaire) avant chaque release. Une marque détectée (`brand`, `brand:wikidata`, `operator`, liste de référence) sans entrée dans la table **fait échouer le build**.
   - **Autres commerces** : déformation **générée par règle et déterministe** (graine = identifiant OSM) ; distance d'édition ≥ 2 et ≥ 30 % de la longueur ; contrôle contre la table des marques (pas de collision avec une marque réelle) et contre une liste de mots injurieux.
3. La déformation est appliquée **au moment de la génération des tuiles**, par une étape dédiée `naming` du pipeline. C'est une **couche de nommage séparée** des données OSM brutes : seules les tuiles contiennent le nom affiché.
4. **Surcharges** (`content/place-names/overrides/<osmId>.json`) pour corriger un nom ou **retirer** un nom sur demande (remplacement par le libellé générique du type de lieu) ; application par un rebuild incrémental de `naming` (≤ 15 min), délai cible de 72 h, journal `place_name_takedown`.
5. **Aucun logo, aucune couleur dominante ni charte graphique** d'une marque réelle, nulle part (enseignes 3D, kiosques, emballages, UI). **Aucun contenu dénigrant** associé à un commerce ; en v2, le crime ne cible pas les commerces identifiables.
6. **Mentions légales** : noms de commerces et de marques fictifs ou parodiques, aucune affiliation ; noms de lieux publics issus d'OpenStreetMap.
7. Les **commerces de joueurs** portent un nom choisi par le joueur, modéré et refusé s'il est trop proche d'une marque de la table.
8. Tout nom affiché est **échappé** (jamais interprété comme du HTML).

## Réserve de l'architecte (contradiction ferme)

- **Désaccord** : une déformation trop légère (une lettre) n'élimine pas le risque.
- **Pourquoi** : en Côte d'Ivoire (Accord de Bangui / OAPI), le critère est le **risque de confusion**. « Oronge » sur un kiosque de mobile money peut rester une imitation, surtout avec les couleurs de la marque. L'exception de parodie est plus étroite et moins prévisible qu'aux États-Unis.
- **Alternative retenue** : distance minimale imposée par la règle, aucune charte graphique, revue humaine, retrait sur demande, **validation juridique avant la bêta publique** (Q8). La force de la déformation reste un paramètre (Q15).
- **Décision** : le propriétaire tranche ; la règle par défaut ci-dessus s'applique.

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| Noms OSM bruts partout (décision antérieure) | Risques de marques et de diffamation (remplacée par le propriétaire) |
| Noms entièrement fictifs pour tous les commerces | Perd la reconnaissance du quartier recherchée par le propriétaire |
| Déformation à l'exécution (côté client ou serveur) | Rend le nom affiché non reproductible et non publiable avec la base dérivée ; la décision la fixe à la génération |

## Conséquences

- Nouvelle étape `naming` du pipeline et tâche « table de parodie des marques » (roadmap J2-16), revue humaine récurrente.
- Les noms affichés font partie de la base dérivée publiée sous ODbL (ADR 0006) ; les tables de parodie et de surcharges restent du contenu propriétaire.
- Un retrait demande un rebuild partiel et l'invalidation du cache client (hash de tuile).
