# SKYLINE — Abidjan District
## Plan de production des assets — équipe interne

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 12 octobre 2026 |
| **Documents parents** | Cahier des charges v1.1, Dossier de level design de la carte MVP v1.0 |
| **Mode de production** | Équipe interne |
| **Statut** | Proposition à adapter à la composition réelle de l'équipe |

> **Hypothèses.** La composition exacte de l'équipe n'est pas connue. Ce document raisonne donc par **rôles** et propose un scénario de référence (section 2.2). Les estimations d'effort sont des **ordres de grandeur en jours-personne**, à recalibrer après le premier asset terminé (voir 9.3). Tous les budgets techniques sont des points de départ à valider par des mesures.

---

# 1. Objet

Ce document transforme la liste d'assets du dossier de level design en **plan de production** : qui fait quoi, avec quels outils, selon quel pipeline, dans quel ordre, avec quels critères de réception et quelle charge estimée.

Il couvre : modèles 3D, personnages et animations, interface, son et textes. Il ne couvre pas le code.

---

# 2. Rôles et équipe

## 2.1. Rôles nécessaires

| Rôle | Responsabilités | Charge dans le projet |
|---|---|---|
| **Direction artistique (DA)** | Guide de style, références, validation de chaque lot, relation avec les relecteurs locaux | Ponctuelle mais critique |
| **Artiste environnement / props** | Bâtiments, façades, sols, accessoires, végétation, UV et textures | Principale |
| **Artiste personnages** | Modèles joueur, PNJ, gardes, textures | Moyenne |
| **Animateur / rigger** | Squelette, skinning, animations, retargeting | Moyenne, concentrée en phase 2 |
| **Artiste technique** | Pipeline d'export glTF, LOD, atlas, scripts de validation, intégration Babylon.js | Transversale |
| **Artiste UI** | HUD, icônes, écrans | Faible, par vagues |
| **Son** | Sons, ambiances, mixage | Faible, par vagues |
| **Rédaction** | Dialogues, objectifs, messages | Faible |
| **Relecteurs locaux** | Relecture du style, des noms et des dialogues | Ponctuelle, hors équipe |

Une même personne peut tenir plusieurs rôles. **Le rôle d'artiste technique est le plus souvent oublié et le plus rentable** : sans lui, les budgets de performance dérivent.

## 2.2. Scénario de référence (équipe minimale)

| Poste | Effectif |
|---|---:|
| DA (peut aussi modéliser) | 1 |
| Artiste environnement | 1 à 2 |
| Artiste personnages + animation | 1 |
| Artiste technique (peut être le développeur client) | 0,5 à 1 |
| UI, son, rédaction | Partagés ou ponctuels |

Avec cette équipe, les durées de la section 9 sont réalistes. Avec moins de personnes, les durées s'allongent à peu près proportionnellement ; il faut alors **réduire le périmètre du lot 2**, pas la qualité du lot 1.

---

# 3. Outils et formats

## 3.1. Outils proposés

Le choix reste à l'équipe ; ces propositions privilégient des outils gratuits ou peu coûteux et un export glTF fiable.

| Besoin | Option proposée | Alternatives |
|---|---|---|
| Modélisation, UV, rig, animation | Blender | Autre DCC avec export glTF fiable |
| Sculpture et détails (facultatif) | Blender | ZBrush, Nomad |
| Texturage | Blender, Krita, Substance (si licence) | Procédural + atlas peints à la main |
| Compression des modèles | gltf-transform (Meshopt ou Draco) | — |
| Compression des textures | KTX2 (outils basis_universal / toktx) | — |
| Visualisation de contrôle | Babylon.js Sandbox ou visionneuse interne | — |
| Audio | Audacity, Reaper | — |
| UI | Figma, Krita, Inkscape | — |
| Contrôle de version | Git avec Git LFS pour les fichiers lourds | — |

**Vérifier les licences** de chaque outil pour un usage commercial avant de s'engager.

## 3.2. Formats

| Usage | Format |
|---|---|
| Source de travail | Fichiers natifs (.blend, etc.), **hors branche principale du jeu** ou via LFS |
| Livraison 3D | glTF binaire (**.glb**) |
| Textures livrées | PNG/JPEG en développement, **KTX2** en intégration finale |
| Audio | OGG ou MP3 compressé en boucle propre ; WAV pour les sources |
| UI | SVG (icônes), PNG (autres) ; polices : formats web (WOFF2) |

---

# 4. Pipeline de production d'un asset

## 4.1. Étapes

1. **Brief** : fiche de l'asset (ID, rôle, budget, références).
2. **Blockout de l'asset** : volume simple à la bonne échelle, validé dans la scène de blockout du jeu.
3. **Modélisation** : maillage final, conforme aux budgets.
4. **UV et textures** : atlas partagés, matériaux limités.
5. **LOD** : LOD1 et LOD2 quand nécessaires.
6. **Rig et animation** (personnages).
7. **Export** : glTF avec nommage et conventions.
8. **Contrôle automatique** : script de validation (section 8.2).
9. **Revue** : revue DA et revue technique dans le jeu, pas seulement dans le logiciel de modélisation.
10. **Intégration** : ajout au dépôt, au registre d'assets et, si nécessaire, aux fichiers de données.

## 4.2. Définition de « terminé »

Un asset est terminé lorsque :
- il respecte les budgets de triangles, matériaux et textures ;
- il est à la **bonne échelle** (1 unité = 1 m) avec le **bon pivot** ;
- son nom suit la convention ;
- ses LOD existent s'ils sont requis ;
- il passe le contrôle automatique ;
- il a été **vu dans le jeu**, avec l'éclairage final, et validé par la DA ;
- il figure au **registre d'assets**, avec sa licence si une partie n'est pas créée en interne.

## 4.3. Cycle de revue

- Revue **par lot** de la DA (pas asset par asset), avec captures dans le jeu.
- **Deux tours de correction** maximum par lot avant arbitrage.
- Les retours des relecteurs locaux sont traités **avant** la production en série (sur les prototypes de façade, de personnage et de marché), pas à la fin.

---

# 5. Conventions techniques

## 5.1. Échelle, pivot, orientation

| Sujet | Règle |
|---|---|
| Unité | 1 unité = 1 mètre |
| Taille du personnage | Environ 1,75 m |
| Pivot des bâtiments et accessoires | Au sol, au centre de l'emprise |
| Pivot des objets portables | À l'endroit de la prise en main |
| Orientation de face | Une convention unique (par exemple +z vers l'avant du modèle), **fixée au lot 0** et documentée |
| Hauteur des portes | ≥ 2,1 m |
| Largeur minimale de passage | 1,2 m (voir dossier de level design, 11.5) |

## 5.2. Nommage

Format : `categorie_nom_variante_lod`, en minuscules, sans espace ni accent.

| Préfixe | Catégorie | Exemple |
|---|---|---|
| `bld_` | Bâtiments et modules | `bld_shop_a_lod0` |
| `prop_` | Accessoires | `prop_stall_02_lod1` |
| `veg_` | Végétation | `veg_mango_01_lod0` |
| `gnd_` | Sols | `gnd_road_worn_01` |
| `chr_` | Personnages | `chr_guard_01_lod0` |
| `anm_` | Animations | `anm_player_walk_fwd` |
| `ui_` | Interface | `ui_icon_parcel` |
| `sfx_` / `amb_` / `mus_` | Sons, ambiances, musiques | `sfx_pistol_shot_01` |
| `itm_` | Objets de gameplay | `itm_bag_parts` |

Un identifiant d'asset est **unique et stable** : on ne renomme pas sans migration des données de jeu.

## 5.3. Budgets de triangles (LOD0)

| Type | Budget |
|---|---:|
| Module de bâtiment | 1 500 à 5 000 |
| Accessoire de rue | 100 à 800 |
| Arbre | 800 à 2 500 |
| Personnage | 6 000 à 12 000 |
| Pistolet | 1 000 à 3 000 |

Les **LOD** sont obligatoires pour les bâtiments, les arbres et les personnages. Les budgets globaux de scène sont ceux du dossier de level design (section 14).

## 5.4. Textures et matériaux

- Résolution maximale **2048 × 2048** (1024 pour les accessoires).
- **Atlas partagés** pour façades, accessoires et sols.
- **Peu de matériaux** : l'objectif est de rester sous 40 matériaux différents dans la scène.
- Convention PBR simplifiée ou peinture à la main : **un seul parti pris** pour tout le jeu, décidé par la DA au lot 0.
- Densité de texels cohérente d'un asset à l'autre.

---

# 6. Catalogue d'assets

**Priorité :** P0 = indispensable au lot concerné, P1 = important, P2 = si le temps le permet.
**Effort :** jours-personne, ordre de grandeur, tout compris (modélisation, UV, textures, LOD, export, revue).

## 6.1. Lot 1 — vertical slice (phase 2)

### Environnement

| ID | Asset | Prio | Budget LOD0 | Effort (j) |
|---|---|:-:|---:|---:|
| `bld_garage` | Garage de Kader, extérieur et intérieur | P0 | ≤ 8 000 | 8 à 12 |
| `bld_depot` | Dépôt : clôture, portails, hangar | P0 | ≤ 8 000 | 8 à 12 |
| `bld_kiosk` | Kiosque de munitions | P0 | ≤ 2 500 | 2 à 3 |
| `veg_tree_square` | Grand arbre de la place | P0 | ≤ 4 000 | 3 à 5 |
| `prop_square_set` | Mobilier de la place (bancs, abris) | P1 | ≤ 3 000 | 2 à 3 |
| `bld_mod_a` à `bld_mod_e` | 4 à 6 modules de bâtiments génériques | P0 | 1 500 à 4 000 chacun | 8 à 12 |
| `gnd_road`, `gnd_sidewalk`, `gnd_dirt` | 3 à 4 sols | P0 | — | 4 à 6 |
| `prop_cover_set` | Palettes, fûts, caisses (couvertures du dépôt) | P0 | 100 à 500 chacun | 3 à 5 |
| `prop_garage_set` | Établi, outils, pièces, carcasses immobiles | P1 | 200 à 1 500 | 4 à 6 |

### Objets de gameplay

| ID | Asset | Prio | Budget | Effort (j) |
|---|---|:-:|---:|---:|
| `itm_pistol` | Pistolet compact (modèle joueur et ennemis) | P0 | ≤ 3 000 | 2 à 3 |
| `itm_bag_parts` | Sac de pièces | P0 | ≤ 800 | 1 |
| `itm_parcel` | Colis | P0 | ≤ 500 | 0,5 |
| `itm_ammo_crate` | Caisse de munitions | P0 | ≤ 800 | 1 |

### Personnages

| ID | Asset | Prio | Budget | Effort (j) |
|---|---|:-:|---:|---:|
| `chr_player` | Joueur (maillage, textures, LOD, skinning) | P0 | ≤ 12 000 | 5 à 8 |
| `chr_kader` | Kader | P0 | ≤ 12 000 | 4 à 6 |
| `chr_guard_01` (+ variante) | Garde, avec une variante de tenue | P0 | ≤ 12 000 | 5 à 8 |
| `chr_npc_tmp_01..03` | PNJ génériques temporaires (variantes d'un maillage de base) | P1 | ≤ 10 000 | 4 à 6 |
| `rig_humanoid` | Squelette humanoïde commun | P0 | — | 3 à 5 |

### Animations

Voir 7.2. Effort total estimé pour le lot 1 : **8 à 14 j.**

### Interface

| ID | Asset | Prio | Effort (j) |
|---|---|:-:|---:|
| `ui_hud_*` | Icônes de santé, munitions, Djai ; barre de santé | P0 | 2 à 3 |
| `ui_crosshair` | Réticule (statique et en visée) | P0 | 0,5 |
| `ui_prompt_interact` | Indicateur « E — Parler » | P0 | 0,5 |
| `ui_icon_parcel`, `ui_icon_search`, `ui_icon_handshake` | Icônes d'activités | P1 | 1 à 2 |
| Police(s) | 1 à 2 polices web avec licence claire | P0 | 0,5 |

### Son

| ID | Asset | Prio | Effort (j) |
|---|---|:-:|---:|
| `sfx_footstep_*` | Pas (au moins 2 surfaces) | P0 | 1 |
| `sfx_pistol_shot_*`, `sfx_pistol_reload` | Tir et rechargement | P0 | 1 à 2 |
| `sfx_ui_*` | Interaction, validation d'objectif, réussite, échec | P0 | 1 à 2 |
| `amb_city_loop` | Ambiance urbaine en boucle | P0 | 1 à 2 |
| `sfx_enemy_*` | Réactions simples des gardes | P1 | 1 |

### Textes

Dialogues de Kader et du vendeur, textes de la mission 01, messages d'interface : **3 à 5 j** de rédaction et de relecture.

### Total indicatif du lot 1

**Environ 80 à 120 jours-personne**, en comptant revues et corrections.

## 6.2. Lot 2 — contenu complet (phases 3 à 5)

| Catégorie | Contenu | Prio | Effort (j) |
|---|---|:-:|---:|
| Bâtiments | Kit complet : 6 à 10 modules, extensions de variantes | P0 | 20 à 35 |
| Façades | 15 à 25 façades et devantures sur atlas | P0 | 15 à 30 |
| Toitures, auvents, enceintes | 10 à 14 éléments | P0 | 8 à 14 |
| Intérieurs | 1 à 2 commerces | P1 | 8 à 16 |
| Végétation | 6 à 10 modèles | P0 | 10 à 16 |
| Mobilier et accessoires | 10 à 15 mobilier ; 15 à 20 étals et accessoires | P0 | 15 à 25 |
| Carcasses de véhicules immobiles | 2 à 3 | P1 | 4 à 6 |
| Repères | Château d'eau ou tour, enseigne géante, bannière | P0 | 5 à 8 |
| Personnages | 6 PNJ interactifs, 6 à 10 PNJ d'ambiance | P0 | 30 à 50 |
| Objets d'activités | Objets perdus, matériel à transporter | P0 | 3 à 5 |
| Interface | Écrans (démarrage, pause, mort, matchmaking), minimap, notifications | P0/P1 | 10 à 16 |
| Son | Ambiances par zone, surfaces, sons de PNJ | P1 | 8 à 14 |
| Textes | Dialogues des 6 autres PNJ, demandes d'activités, messages réseau | P0 | 5 à 8 |
| Éclairage, ciel | Réglage final et ciel | P0 | 3 à 6 |
| **Total indicatif** | | | **≈ 150 à 250** |

---

# 7. Personnages et animations

## 7.1. Squelette commun

- **Un seul squelette humanoïde** pour le joueur, Kader, les gardes et les PNJ. Cela permet de **réutiliser toutes les animations** (retargeting inutile).
- Nombre d'os : à limiter (de l'ordre de 40 à 60) pour le coût du skinning côté navigateur.
- Convention d'os et d'échelle **figée au lot 0** ; une modification ultérieure du squelette invalide toutes les animations.
- Point d'attache de l'**arme** (main droite) et point d'attache du **sac ou colis** (dos ou main).

## 7.2. Liste d'animations

Le dossier de level design parlait d'environ **11 animations de base**. Si l'on compte les **variantes directionnelles**, le besoin réel est plutôt de **25 à 30 clips**, car le personnage se déplace aussi de côté et en arrière en visant.

| Groupe | Clips | Boucle |
|---|---|:-:|
| Repos | Repos debout, repos accroupi | Oui |
| Déplacement debout | Marche (avant, arrière, gauche, droite), course (idem) | Oui |
| Déplacement accroupi | Marche accroupie (4 directions) | Oui |
| Saut | Départ, vol, réception | Non |
| Visée | Repos en visée, marche en visée (4 directions) | Oui |
| Combat | Tir, rechargement, recul (additifs si possible) | Non |
| Interaction | Interaction courte, ramassage | Non |
| Dommages | Réaction à un tir, mort | Non |
| Dialogue / ambiance | Parler, attendre, discuter | Oui |
| Gardes | Patrouille, alerte | Oui |

**Économies possibles** (à décider avec l'animateur et le développeur) :
- mélange d'animations (blend) pour limiter les clips directionnels ;
- animations additives pour la visée et le tir, superposées au déplacement ;
- partage des animations de PNJ d'ambiance.

## 7.3. Interaction avec le réseau

L'animation des joueurs distants est pilotée par la **pose** transmise (énumération : arrêt, marche, course, saut, accroupi, visée) et non par un flux d'animation. Chaque pose doit donc correspondre à un **état d'animation défini** ; les transitions entre états sont fixées avec le développeur réseau.

## 7.4. Vue à la première personne (décision à prendre)

La caméra FPS (touche `V`) demande de choisir :

| Option | Description | Charge |
|---|---|---|
| **A. Corps complet masqué** | La caméra est placée à la tête, seul le pistolet est visible, animé simplement | Faible |
| **B. Bras de vue subjective** | Modèle de bras et d'arme dédié, animations spécifiques de tir et de rechargement | +8 à +15 j |

**Recommandation : option A pour le MVP.**

---

# 8. Validation et réception

## 8.1. Grille de réception par asset

- [ ] Nom conforme, identifiant unique, enregistré.
- [ ] Échelle et pivot corrects.
- [ ] Budget de triangles respecté (LOD0 et LOD).
- [ ] Matériaux et textures dans le budget, atlas partagés utilisés.
- [ ] Aucun polygone caché, aucune face inversée, normales correctes.
- [ ] UV sans chevauchement problématique.
- [ ] Rendu validé **dans le jeu**, avec l'éclairage de référence.
- [ ] Aucune marque réelle, aucun logo ni lieu identifiable.
- [ ] Licence documentée au registre si l'asset n'est pas entièrement interne.
- [ ] Validation de la DA.

## 8.2. Contrôle automatique

Un script d'artiste technique (Node.js avec gltf-transform, ou Python) lit chaque fichier livré et vérifie :

| Contrôle | Règle |
|---|---|
| Nommage | Conforme au motif `categorie_nom_variante_lod` |
| Triangles | ≤ budget de la catégorie |
| Taille du fichier | ≤ seuil par catégorie |
| Échelle | Boîte englobante cohérente avec la catégorie |
| Matériaux | ≤ nombre autorisé, noms valides |
| Textures | Dimensions autorisées, formats valides |
| Animations | Noms conformes, squelette identique à `rig_humanoid` |
| Hiérarchie | Pas d'objets inutiles, pas de caméras ni lumières parasites |

Le script tourne **avant chaque intégration** et en **intégration continue**. Je peux l'écrire et le brancher au dépôt dès que les conventions du lot 0 sont figées.

## 8.3. Revue de performance

À chaque lot terminé, mesure dans la scène : FPS moyen et minimal, triangles visibles, draw calls, matériaux, mémoire GPU, temps de chargement. Un lot qui **dépasse le budget** n'est pas accepté tant qu'il n'est pas corrigé.

---

# 9. Planning

## 9.1. Alignement sur les jalons de la carte

| Jalon | Production d'assets | Phase du CDC |
|---|---|---|
| **LD-0** | **Lot 0** : guide de style, conventions, squelette, scène de test, script de validation, premier prototype de façade et de personnage | Avant la phase 1 |
| **LD-1** | Blockout du quartier ; modèle de joueur provisoire | Phase 1 |
| **LD-2** | **Lot 1** : assets de la mission 01, joueur, Kader, gardes, animations, HUD, sons de base | Phase 2 |
| **LD-3** | **Lot 2** : kit et remplissage du quartier, PNJ, interface complète, sons | Phases 2 à 5 |
| **LD-4** | Optimisation, éclairage, verrouillage | Phase 5 |

## 9.2. Lot 0 : ce qu'il faut produire en premier

| Livrable | Rôle |
|---|---|
| Guide de style (planches de références, palette, matériaux, niveau de détail) | Aligne toute l'équipe |
| Conventions techniques de la section 5, validées | Évite les refontes |
| Squelette humanoïde et personnage de test | Débloque les animations |
| Scène de test avec éclairage de référence | Revue dans le jeu |
| Script de contrôle automatique | Garde-fou |
| **Prototype vertical** : une façade, un accessoire, un personnage au niveau de qualité final | Valide le style, le budget et la charge réelle |
| Relecture du prototype par les relecteurs locaux | Corrige le style avant la production en série |

## 9.3. Calibrage de l'effort

Les efforts de la section 6 sont des fourchettes génériques. **Après le prototype vertical**, on mesure le temps réel et on recalibre l'ensemble. C'est la seule façon fiable d'estimer le lot 2.

## 9.4. Ordre de production du lot 1

1. Squelette, joueur, animations de déplacement.
2. Garage et dépôt (lieux de la mission 01).
3. Gardes, Kader, pistolet, objets de gameplay.
4. Modules de bâtiments et sols du trajet entre le garage et le dépôt.
5. HUD et sons de base.
6. Place centrale et kiosque.

Ainsi, la **mission 01 est jouable avec de vrais assets avant** le reste du quartier.

## 9.5. Scénario de capacité (indicatif)

Hypothèse : 3 personnes de production (2 artistes 3D dont 1 avec animation, 1 artiste technique à mi-temps), environ 4 jours productifs par semaine et par personne.

| Lot | Charge indicative | Durée indicative |
|---|---:|---:|
| Lot 0 | 15 à 25 j | 2 à 3 semaines |
| Lot 1 | 80 à 120 j | 7 à 10 semaines |
| Lot 2 | 150 à 250 j | 13 à 21 semaines |

Ces durées sont **purement indicatives** et dépendent du niveau de l'équipe, de la complexité du style et du nombre de cycles de revue.

---

# 10. Organisation du dépôt et du travail

## 10.1. Séparation sources et exports

| Contenu | Où |
|---|---|
| Fichiers natifs de travail (.blend, textures sources, références) | Dépôt dédié aux sources, ou Git LFS, **séparé du dépôt de code** |
| Exports glTF, textures optimisées, audio compressé | `apps/web/public/assets/world/…` (voir dossier de level design, 19.1) |
| Registre d'assets et de licences | `docs/assets/` |

## 10.2. Règles de travail

- Une **branche par lot** d'assets, intégrée par demande de fusion après revue.
- **Aucun asset binaire** non passé par le contrôle automatique.
- Un seul propriétaire par asset à un instant donné (pas d'édition concurrente d'un fichier binaire).
- Journal de modification dans le registre pour chaque asset retouché.

## 10.3. Registre d'assets

| Champ | Contenu |
|---|---|
| ID | Identifiant unique |
| Catégorie, lot, priorité | |
| Statut | À faire, en cours, en revue, accepté, intégré |
| Auteur | |
| Budget et mesure réelle | Triangles, matériaux, poids |
| Licence et source | Pour tout élément non entièrement interne (références, polices, sons, textures achetées) |
| Date de dernière validation | |

---

# 11. Risques et réponses

| Risque | Réponse |
|---|---|
| Dérive du style entre artistes | Guide de style et prototype vertical validés avant la production en série |
| Budgets de performance dépassés | Script de contrôle, mesure à chaque lot, artiste technique dédié |
| Squelette modifié après coup | Squelette figé au lot 0 ; changement = décision de direction |
| Animations insuffisantes pour le réseau et la visée | États d'animation définis avec le développeur réseau dès la phase 2 |
| Charge sous-estimée | Recalibrage après le prototype vertical ; réduction du lot 2 plutôt que de la qualité du lot 1 |
| Représentation maladroite du contexte local | Relecteurs locaux sur le prototype, puis par lot |
| Sources non documentées (références, polices, sons) | Registre de licences obligatoire |
| Perte de fichiers sources | Sauvegarde et LFS, convention de commit |
| Dépendance à une personne clé | Documentation des conventions et du pipeline |

---

# 12. Décisions et informations à fournir

| # | Question | Pourquoi c'est nécessaire |
|---|---|---|
| A1 | **Composition réelle de l'équipe** (rôles, disponibilité, niveau) | Recalibrer les durées de la section 9 |
| A2 | **Style visuel** : peint à la main, stylisé semi-réaliste PBR ? | Détermine les textures, les matériaux et la charge |
| A3 | **Outil principal de modélisation** et de texturage | Fixe le pipeline d'export |
| A4 | **Vue à la première personne** : option A ou B (7.4) | Charge d'animation |
| A5 | **Source des sons et des polices** : création interne, banques sous licence ? | Registre de licences |
| A6 | **Machine de référence** pour les budgets | Valide les budgets de scène |
| A7 | **Relecteurs locaux** identifiés | Planifier les revues |
| A8 | **Convention d'orientation et de pivot** | À figer au lot 0 |

---

# 13. Prochaines actions

1. Répondre aux questions A1 à A8, au moins A1, A2, A3 et A8.
2. Lancer le **lot 0** : guide de style, conventions, squelette, scène de test.
3. Produire le **prototype vertical** (une façade, un accessoire, un personnage) et le faire relire.
4. Recalibrer les estimations, puis planifier le **lot 1**.
5. Mettre en place le **script de contrôle automatique** et le **registre d'assets**.
