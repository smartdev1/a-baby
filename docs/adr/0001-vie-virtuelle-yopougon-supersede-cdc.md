# ADR 0001 — La vision « vie virtuelle Yopougon » remplace le CDC v1.1

- **Statut** : Acceptée (propriétaire, 13/10/2026)
- **Décideurs** : propriétaire ; rédaction : agent Architecte
- **Remplace** : `SKYLINE_cahier_des_charges_v1.1.md` (vision, périmètre, stack), `SKYLINE_dossier_level_design_carte_MVP.md`

## Contexte

Le CDC v1.1 décrivait un jeu d'action TPS/FPS « à la GTA » dans un quartier **fictif** de 300 × 300 m (combat, mission 01, sessions de 8 joueurs). Le code existant importe pourtant un morceau **réel** d'Abidjan depuis OSM (cf. `docs/cartographie-projet.md` §6). Le propriétaire a validé une nouvelle vision : une simulation de vie quotidienne dans la commune entière de Yopougon, à l'échelle 1:1, dans un monde unique persistant.

## Décision

1. `ARCHITECTURE.md` devient la référence. Le CDC v1.1 et le dossier de level design sont **archivés** (`docs/archive/`) avec un bandeau « SUPERSEDÉ ».
2. Le MVP couvre : Yopougon entière générée depuis OSM, la vie quotidienne (moteur d'actions), les transports, la propriété et les commerces de joueurs, le multijoueur MMO, l'économie Djai fictive.
3. Le combat, les missions, la police et la criminalité passent en **v2**, avec des points d'extension prévus (ARCHITECTURE §25) mais non construits.
4. Restent valables et réutilisés : les principes du CDC sur le réseau autoritaire (§14), l'économie atomique et idempotente (§11.4, §12.4, §15.2), la sécurité (§16) et la performance client (§17).

## Alternatives écartées

- **Garder le CDC et ajouter la vie virtuelle par-dessus** : deux produits en un, aucun des deux ne serait fini.
- **Quartier fictif dessiné à la main** : contredit la vision (monde réel) et ne passe pas à l'échelle d'une commune.

## Conséquences

- La contrainte de 300 m et tout ce qui la code en dur disparaissent (bug d'échelle C1).
- Colyseus, les types de combat de `contracts` et le schéma Prisma actuel sont retirés ou réécrits (ADR 0003, ARCHITECTURE §26).
- La section « Contexte projet » de `CLAUDE.md` devient obsolète. Sa mise à jour relève du propriétaire (fichier protégé).
- Les estimations de délai de CLAUDE.md (9 à 14 mois en solo pour 300 m) ne s'appliquent plus ; voir `docs/roadmap.md`.
