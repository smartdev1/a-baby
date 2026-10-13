# ADR 0004 — Moteur d'actions générique piloté par les données

- **Statut** : Proposée
- **Date** : 13/10/2026

## Contexte

Le propriétaire veut un module d'actions **complet et ambitieux** : des dizaines d'activités ivoiriennes (garba, maquis, tresses, foot de quartier, église, mosquée, travail, logement, commerces…). Coder chaque activité à la main produirait des centaines de fichiers spécifiques, de la duplication, et un goulot d'étranglement sur les développeurs.

## Décision

1. **Une action = une fiche JSON** dans `content/actions/<catégorie>/<id>.action.json` : lieu et site, fenêtres horaires (temps de jeu), conditions, coût, durée (temps de jeu + plafond réel pour l'ellipse), phases et animations, effets (besoins, argent, objets, compétences, buffs), issues pondérées, participants, fournisseur (lieu PNJ, système, employeur, **commerce de joueur**), extensions v2 (`legality`, `witnessable`, `missionHooks`).
2. **Moteur pur** `@skyline/sim-actions` : évaluation des conditions, machine à états (`requested → validated → reserved → running → completed/interrupted/failed → settled`), **registres extensibles** de conditions, d'effets, de fournisseurs et de rôles.
3. **Autorité serveur** : la zone exécute le moteur ; le client l'utilise seulement en **aperçu** (griser les actions impossibles et dire pourquoi).
4. **Règlement économique unique et idempotent** (`action:{requestId}`) via `EconomyPort` ; les effets d'argent produisent des jambes d'écriture et ne modifient jamais un solde directement.
5. **Schéma Zod source de vérité** ; JSON Schema généré pour l'autocomplétion ; `content-cli` valide en CI les références croisées (animations, objets, lieux, clés i18n).

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| Une classe par action | Explosion du code, duplication, chaque ajout exige un développeur |
| Langage de script embarqué (Lua, JS évalué) | Surface d'attaque, difficile à valider et à tester, inutile pour des règles déclaratives |
| Arbre de comportement générique | Surdimensionné pour des actions joueur ; à réserver éventuellement aux PNJ |
| Tables en base de données | Pas de revue de code, pas de versionnement Git, déploiement plus complexe |

## Conséquences

- Ajouter une action avec des effets existants = 1 fichier JSON + des clés i18n, **0 ligne de code** (critère de recette J3).
- Un nouveau *type* d'effet ou de condition = un gestionnaire enregistré (Open/Closed).
- Le combat et les missions de la v2 s'ajoutent par de nouveaux gestionnaires (`damage`, `mission_progress`), sans réécrire le moteur.
- Le contenu devient un livrable à part entière, porté par le propriétaire (rédaction, équilibrage, dialogues en nouchi).
