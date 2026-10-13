# ADR 0005 — Rendu semi-réaliste par génération procédurale à partir de kits modulaires

- **Statut** : Proposée. Le choix du semi-réaliste est celui du propriétaire ; les conditions de coût restent à valider (Q1)
- **Date** : 13/10/2026

## Contexte

Le propriétaire veut un rendu **semi-réaliste** (PBR) sur une commune entière (environ 10⁵ bâtiments), sur PC modeste d'abord, avec le mobile en ligne de mire. L'équipe compte trois développeurs et **aucun artiste**.

## Décision

1. **Façades générées hors ligne** par le pipeline : chaque mur est découpé en travées de 2,5 à 4 m et en étages de 3 m ; chaque travée reçoit un module du kit choisi par une grammaire de profil de quartier et une graine déterministe ; les toits sont plats (terrasse, acrotère, cuves) ou en tôle. La sortie est une **liste d'instances**, pas un maillage.
2. **Rendu** : thin instances Babylon par module ; ≤ 12 matériaux maîtres PBR ; variations par **tableaux de textures** et par un plugin de matériau (teinte, salissure, usure) ; KTX2 (ETC1S/UASTC) ; meshopt ; AO précalculée ; décalcomanies (enseignes peintes, publicités fictives ou parodiées).
3. **LOD** L0 → L3 avec imposteurs, végétation instanciée avec imposteurs octaédriques, foule en VAT.
4. **Lieux héros** (≈ 12) modélisés à la main et substitués par identifiant OSM.
5. **Profils de qualité** Bas, Moyen, Haut, Mobile, avec des budgets chiffrés (ARCHITECTURE §12.7). Cible : ≥ 30 FPS p5 sur la machine basse (GPU intégré).
6. **L'art est de la donnée** : le code fonctionne avec un kit gris ; l'art remplace le kit sans toucher au code.
7. **Spike SP1 avant toute production en série** (go/no-go sur machine basse).

## Alternatives écartées

| Option                                            | Raison du rejet                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Modéliser chaque bâtiment                         | Infaisable à l'échelle d'une commune                                                                      |
| Photogrammétrie ou maillages 3D réels             | Pas de données ouvertes adaptées pour Yopougon ; volume et licence prohibitifs                            |
| Extrusions simples texturées (style « maquette ») | Rejeté par le propriétaire (semi-réaliste demandé) ; reste le repli des LOD lointains et du profil Mobile |
| Style stylisé ou low-poly                         | Moins coûteux, mais contraire au choix du propriétaire                                                    |
| Maillages fusionnés par tuile pour les façades    | Tuiles 5 à 10 fois plus lourdes ; perte du bénéfice de l'instanciation                                    |

## Conséquences et coût (réserve de l'architecte)

- Coût artistique estimé à **22 à 36 personnes-mois** (kit de façades, matériaux, props, végétation, personnages, animations, véhicules, lieux héros), soit environ **35 000 à 115 000 €** avec un freelance, plus 3 000 à 8 000 € de packs d'assets [hypothèses ARCHITECTURE §12.8].
- **Sans artiste dédié**, la roadmap glisse de 6 à 9 mois, ou le rendu reste gris. Avec un seul artiste, le MVP sort avec un kit v1 réduit, complété après la bêta.
- Le risque de performance sur GPU intégré est **élevé** : le profil Bas peut devoir renoncer aux ombres, réduire le rayon de détail et l'échelle de rendu.
