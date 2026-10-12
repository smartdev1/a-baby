# SKYLINE — Abidjan District
## Plan de production des assets — v1.1 (production par une seule personne)

| | |
|---|---|
| **Version** | 1.1 — met à jour la v1.0 |
| **Date** | 12 octobre 2026 |
| **Documents parents** | Cahier des charges v1.1, Dossier de level design v1.0, Plan de production des assets v1.0 |
| **Équipe assets** | **Une seule personne** |
| **Style** | Semi-réaliste PBR |
| **Statut** | Proposition à valider, avec trois scénarios de périmètre |

> **Statut des valeurs.** Les efforts sont des **ordres de grandeur en jours-personne**, à recalibrer après le prototype vertical du lot 0. Les licences citées sont celles que je connais ; **chaque licence doit être vérifiée sur la page de l'asset au moment du téléchargement, et sa preuve archivée** (voir 8).

## Sections de la v1.0 remplacées par ce document

| Section v1.0 | Remplacée par |
|---|---|
| 2 (rôles et équipe) | Section 2 |
| 3 (outils et formats) | Section 3 |
| 5 (conventions techniques) | Sections 4 et 5 |
| 7.4 (vue FPS) | Section 6 |
| 9 (planning) | Sections 7 et 9 |
| 12 (questions) | Section 10 (réponses) |

Le reste de la v1.0 (pipeline, catalogue, réception, registre, risques) **reste valable**, avec les adaptations de la section 7.

---

# 1. Décisions prises

| # | Sujet | Décision |
|---|---|---|
| A1 | Équipe | **Une seule personne** pour les assets |
| A2 | Style | Semi-réaliste **PBR** |
| A3 | Outils | Proposés en section 3 |
| A4 | Vue FPS | **Option B** : bras et arme de vue subjective (voir section 6) |
| A5 | Sons et polices | **Banques sous licence** |
| A6 | Machine de référence | Proposée en section 4 |
| A7 | Relecteurs locaux | Profils et calendrier proposés en section 9 |
| A8 | Orientation et pivots | Conventions proposées en section 5 |

## Conséquence principale

Avec une seule personne, **la production 100 % interne de tout le catalogue de la v1.0 représente environ 15 à 24 mois** de travail (section 7). Le style PBR et l'option B augmentent cette charge. Ce document propose donc :

1. une organisation **« héros / kit / fond »** pour concentrer l'effort où il se voit ;
2. trois scénarios de périmètre, dont deux qui recourent à des **banques d'assets sous licence pour les éléments secondaires** (décision D-A9, section 10) ;
3. un ordre de production qui **ne bloque jamais le développement du code**.

---

# 2. Rôle unique : organisation du travail

## 2.1. Ce qu'une seule personne doit couvrir

DA, modélisation, texturage, rig, animation, pipeline technique, intégration, UI, son (sélection et montage), registre de licences.

## 2.2. Règles pour tenir

1. **Toujours un placeholder avant l'asset final.** Chaque asset a d'abord une version volumétrique (cube, capsule) intégrée au jeu : le code n'attend jamais l'art.
2. **Pas de nouveau lot avant la fin du précédent.** Un lot fini et validé vaut mieux que deux lots à moitié faits.
3. **Automatiser le contrôle** (script de validation) pour ne pas relire à la main chaque fichier.
4. **Figer les conventions au lot 0.** Un changement tardif de squelette, d'échelle ou de nommage se paie sur *tous* les assets.
5. **Limiter les cycles de revue** : une revue DA par lot (soi-même, avec captures dans le jeu), plus la revue des relecteurs locaux aux trois moments prévus (section 9).
6. **Réutiliser** : atlas partagés, modules, variations par texture et par teinte plutôt que nouveaux modèles.
7. **Prévoir 20 % de marge** sur toute estimation.

## 2.3. Risque de dépendance

Une seule personne signifie qu'une absence arrête la production. À prévoir : pipeline **documenté**, conventions écrites, sources sauvegardées (LFS et sauvegarde externe), nommage strict.

---

# 3. Outils proposés (A3)

Choix orienté vers **peu de licences payantes**, un export glTF fiable et un flux de travail court pour une seule personne.

| Besoin | Proposition | Remarque |
|---|---|---|
| Modélisation, UV, rig, animation, rendu de contrôle | **Blender** (version LTS récente, à figer pour tout le projet) | Gratuit, exporteur glTF intégré |
| Matériaux PBR de base | **Bibliothèques CC0** (ambientCG, Poly Haven) + **Material Maker** (génération procédurale) | Évite de peindre chaque matériau |
| Peinture de textures | Blender (texture paint), **Krita** | Pour salissures, enseignes, détails |
| Texturage avancé (facultatif) | Substance 3D Painter ou équivalent | **Payant** ; à n'acheter que si le gain de temps est avéré après le prototype |
| Atlas et *trim sheets* | Blender + scripts internes | Clé pour limiter matériaux et temps |
| Optimisation glTF | **gltf-transform** (Meshopt, instancing, nettoyage) | Ligne de commande, scriptable |
| Compression des textures | **KTX2 / Basis** (via gltf-transform ou `toktx`) | Voir 4.3 |
| Visualisation de contrôle | **Babylon.js Sandbox** puis scène de test du jeu | Toujours valider *dans le jeu* |
| Éclairage ambiant | HDRI CC0 (Poly Haven) converti pour Babylon.js | Voir 4.4 |
| Animations de base | **Banque d'animations sous licence** (voir 3.1) retravaillées dans Blender | Réduit fortement la charge |
| Audio : montage | **Audacity** (gratuit) ou Reaper (licence peu coûteuse) | |
| UI | **Figma** (version gratuite) ou Inkscape pour les icônes ; Krita pour le raster | |
| Contrôle de version | **Git + Git LFS** ; sources en dépôt séparé | |
| Automatisation | Scripts **Node.js** (gltf-transform) pour validation et export | Je peux les écrire |

## 3.1. Banques d'assets sous licence (A5)

**Principe : l'asset n'entre dans le projet qu'avec une licence claire pour un usage commercial, dans un jeu web, avec modification autorisée.** Pour chaque asset : capture de la page de licence, URL, date, auteur, conditions d'attribution, archivés dans le registre.

| Besoin | Banques à considérer | À vérifier systématiquement |
|---|---|---|
| Textures, matériaux, HDRI, quelques modèles | ambientCG, Poly Haven (en général CC0) | Licence affichée sur la page de l'asset |
| Modèles low-poly (secondaires) | Kenney, Quaternius (en général CC0) | Compatibilité de style avec le PBR semi-réaliste |
| Modèles divers | Sketchfab, Fab, magasins d'assets | **Licence propre à chaque modèle** ; certaines licences d'éditeur restreignent l'usage à un moteur précis ou interdisent la redistribution des fichiers sources : refuser dans ce cas |
| Animations humanoïdes | Mixamo ou packs d'animations du commerce | Conditions d'usage commercial et de redistribution ; vérifier que les fichiers livrés dans un jeu web sont autorisés |
| Personnage de base | Générateurs de personnages dont la licence autorise l'usage commercial des exports (ex. MakeHuman) | Licence des exports et des vêtements/textures associés |
| Sons | Freesound (filtrer sur CC0 ou licences compatibles), lots « royalty-free » d'éditeurs audio, banques payantes | **Licence par son** ; l'attribution éventuelle est consignée |
| Polices | Google Fonts (licence OFL en général), autres fontes libres | Licence de la police, inclusion web (WOFF2) |
| Icônes | Jeux d'icônes sous licence permissive ou icônes créées en interne | Attribution et modification |

**Interdit :** assets sans licence identifiable, assets « trouvés » sur le web, extraits musicaux ou sonores d'œuvres existantes, logos et marques réelles, assets restreints à un autre moteur.

## 3.2. Formats de livraison

| Usage | Format |
|---|---|
| Source de travail | `.blend`, textures sources, références (dépôt sources, LFS) |
| 3D livrée | **glTF binaire `.glb`**, optimisé par gltf-transform |
| Textures livrées | KTX2 (voir 4.3) |
| Audio | OGG pour le web ; WAV pour les sources |
| Icônes | SVG ; autres éléments UI : PNG |
| Polices | WOFF2 |

---

# 4. Style PBR semi-réaliste et machine de référence

## 4.1. Parti pris graphique

- **Matériaux PBR métal/rugosité** (standard glTF), pas de peinture à la main.
- Détails de surface par **normal maps** et **atlas** plutôt que par géométrie.
- **Salissures, usure, patine** peintes par zones pour donner de l'âme à un quartier tropical sans ajouter de polygones.
- **Peu de matériaux uniques** : la variété vient des *trim sheets*, des atlas, de la teinte par instance et de décalcomanies (decals).
- **Lisibilité d'abord** : contraste suffisant entre lieux fonctionnels et décor (voir dossier de level design, 12).

## 4.2. Gabarit de textures (proposition)

| Paramètre | Valeur de départ |
|---|---|
| Convention de normal map | OpenGL (axe Y vert vers le haut), standard glTF |
| Canaux | **BaseColor** (sRGB) ; **ORM** empaqueté (Occlusion, Roughness, Metallic) ; **Normal** ; **Emissive** si nécessaire |
| Densité de texels bâtiments | 128 px/m environ |
| Densité de texels accessoires proches | 256 px/m environ |
| Densité de texels personnages | 256 à 512 px/m (visage plus haut) |
| Taille maximale | 2048 × 2048 (1024 pour les accessoires) |
| Atlas | Façades, accessoires, sols |

Ces densités sont des **points de départ** à confirmer en lot 0, en observant le rendu aux distances réelles de la caméra TPS et FPS.

## 4.3. Compression

- **KTX2 / Basis** : mode « qualité couleur » (ETC1S) pour les textures de couleur, mode « haute qualité » (UASTC) pour les normal maps, à valider visuellement sur le prototype.
- Maillages : **Meshopt** (ou Draco) via gltf-transform.
- Vérifier la **prise en charge de KTX2 et du décodage Meshopt** dans la version de Babylon.js retenue avant de figer le pipeline.

## 4.4. Éclairage

- Un **HDRI de ciel** (CC0, basse résolution, préfiltré pour Babylon.js) pour l'éclairage ambiant et les reflets.
- **Une lumière directionnelle** (soleil) avec **ombres limitées** autour du joueur.
- Pas de lumière dynamique par PNJ ni par objet.
- **Un seul moment de la journée** pour le MVP : milieu de matinée (proposition du dossier de level design, Q5).

## 4.5. Machine de référence (A6, proposition)

Le public visé joue dans un navigateur, sur des ordinateurs de gamme variée. Je propose deux niveaux, **à confirmer par des mesures auprès de vrais testeurs** (questionnaire matériel dès la première bêta).

| Niveau | Configuration type | Objectif |
|---|---|---|
| **Référence minimale** | Ordinateur portable récent d'entrée de gamme, **GPU intégré** (classe Intel Iris Xe ou équivalent), 8 Go de RAM, Chrome ou Edge récent, 1080p | **30 FPS stables** |
| **Référence confort** | PC avec GPU dédié d'entrée de gamme, 16 Go de RAM, 1080p | **60 FPS** |

### Budgets de scène adaptés à la référence minimale

Je resserre légèrement les budgets du dossier de level design, car un GPU intégré est plus sensible aux draw calls et à la mémoire.

| Budget | Valeur de départ (référence minimale) |
|---|---|
| Triangles visibles | ≤ 300 000 |
| Draw calls | ≤ 250 |
| Matériaux dans la scène | ≤ 30 |
| Mémoire de textures (GPU) | ≤ 400 Mo environ |
| Poids de téléchargement initial (secteur du spawn) | 15 à 30 Mo |
| Personnage (LOD0) | 8 000 à 12 000 triangles (et ≤ 3 500 pour les PNJ d'ambiance au LOD1) |

**Règle :** si le prototype du lot 0 tient 30 FPS avec marge sur la référence minimale, les budgets peuvent être relevés. Si non, ils sont resserrés avant la production en série.

---

# 5. Conventions figées au lot 0 (A8)

## 5.1. Repère et orientation

| Sujet | Convention |
|---|---|
| Unité | Mètre |
| Axe vertical | Y vers le haut (glTF et jeu) |
| Repère du jeu | `x` = est, `y` = haut, `z` = nord (repère à gauche, comme Babylon.js par défaut) |
| Orientation de face d'un asset | **La face avant regarde vers +Z dans le jeu** après import |
| Exporteur Blender | Option « +Y Up » activée (valeur par défaut de l'exporteur glTF) |

### Test d'orientation obligatoire (lot 0)

Un modèle de référence **asymétrique** (une flèche, un personnage simplifié avec un bras repéré) est exporté de Blender, chargé dans Babylon.js, et vérifié :
- face avant vers +Z,
- gauche et droite non inversées,
- échelle correcte.

La transformation éventuelle d'orientation du chargeur est appliquée **à un seul endroit** (le chargeur d'assets), **jamais asset par asset**. Le résultat du test est écrit dans la documentation du pipeline.

## 5.2. Pivots

| Type | Pivot |
|---|---|
| Bâtiments, modules, accessoires posés | Au sol (y = 0), au **centre de l'emprise** |
| Modules d'assemblage | À un **coin de la grille**, en multiples de 0,5 m |
| Objets portables (sac, colis, caisse) | **Point de prise en main** |
| Pistolet | Centre de la poignée, **aligné sur l'os de la main** |
| Personnages | **Pieds au sol**, centre de la capsule |
| Portes et battants | **Charnière** |
| Éléments de végétation | Base du tronc |

## 5.3. Grille de modules

- Modules de bâtiments sur une grille de **0,5 m** (volumes de 2,5 m, 5 m, 10 m).
- Hauteur d'étage : **3 m**.
- Portes : **≥ 2,1 m** de haut, **≥ 1,0 m** de large ; passage minimal du quartier : **1,2 m**.

## 5.4. Squelette humanoïde

- **Un seul squelette** pour joueur, Kader, gardes, PNJ.
- **De 40 à 60 os** au maximum.
- Os de pose prévus : tête, cou, colonne, épaules, bras, mains (doigts simplifiés), bassin, jambes, pieds ; **points d'attache** : arme (main droite), sac ou colis (dos et main).
- Un **squelette de bras de vue subjective** distinct, partageant les noms d'os des bras du squelette principal (voir 6.2).
- Nommage des os : convention unique, figée au lot 0.
- Toute modification du squelette après le lot 0 est une **décision de direction** : elle invalide les animations.

## 5.5. Nommage

Inchangé par rapport à la v1.0 (section 5.2) : `categorie_nom_variante_lod`. Ajouts :

| Préfixe | Catégorie |
|---|---|
| `fps_` | Bras et arme de vue subjective |
| `anm_fps_` | Animations de vue subjective |
| `decal_` | Décalcomanies (salissures, affiches, taches) |
| `trim_` | Trim sheets partagés |

---

# 6. Vue à la première personne : option B (A4)

L'option B est retenue : le joueur voit **ses bras et son arme** en caméra FPS.

## 6.1. Ce que cela ajoute

| Élément | Détail | Effort |
|---|---|---:|
| `fps_arms` | Maillage de bras avec manches, mains, **3 000 à 5 000 triangles** | 3 à 5 j |
| `fps_pistol` | Pistolet détaillé pour la vue rapprochée (plus détaillé que `itm_pistol`) | 2 à 3 j |
| Rig des bras | Squelette dédié, partageant les noms d'os des bras | 1 à 2 j |
| Animations FPS | Voir 6.3 | 3 à 5 j |
| Textures haute densité | Les mains et l'arme sont vues de très près | inclus |
| **Total (option B allégée)** | | **≈ 6 à 10 j** |

Le gabarit complet de la v1.0 estimait 8 à 15 j ; **la version allégée ci-dessous réduit ce coût** en déplaçant une partie du mouvement dans le code.

## 6.2. Rendu

- Les bras et l'arme sont rendus **sur une couche dédiée**, avec un champ de vision propre, pour éviter qu'ils traversent les murs.
- En vue TPS, le modèle de corps complet est utilisé ; en vue FPS, le corps est masqué (hors ombres) et **seuls les bras et l'arme** sont visibles.
- Les joueurs distants voient toujours le modèle de corps complet et l'arme `itm_pistol`.

## 6.3. Animations FPS allégées

| Clip | Boucle | Remarque |
|---|:-:|---|
| Repos | Oui | Légère respiration |
| Visée (repos en visée) | Oui | |
| Tir | Non | Avec recul |
| Rechargement | Non | Le plus long à réaliser |
| Sortie de l'arme (prise en main) | Non | À l'apparition |
| Interaction | Non | Geste de la main |

**Le balancement de marche, de course et de saut est généré dans le code** (oscillation procédurale), et non animé à la main. C'est ce qui permet de tenir le coût d'environ 6 à 10 j.

## 6.4. Cohérence avec le réseau

L'état de pose transmis aux autres joueurs reste celui de la v1.0 (arrêt, marche, course, saut, accroupi, visée). Les animations FPS sont **locales** et ne sont pas synchronisées.

---

# 7. Estimation recalibrée et scénarios de périmètre

## 7.1. Base de calcul

- Production par **une personne**, environ **4 jours productifs par semaine**, soit **environ 17 jours par mois**.
- Estimations de la v1.0, complétées par l'option B et par le style PBR.
- **Marge de 20 % non incluse** dans le tableau (à ajouter).
- Si cette personne assure aussi une partie du **développement**, les durées augmentent d'autant.

## 7.2. Organisation « héros / kit / fond »

| Niveau | Contenu | Production |
|---|---|---|
| **Héros** | Éléments vus de très près ou centraux : joueur, Kader, gardes, pistolet, bras FPS, garage, dépôt, kiosque, place centrale et son arbre | **Interne**, qualité maximale |
| **Kit** | Pièces réutilisables : modules de bâtiments, façades, sols, trim sheets, toitures, auvents | **Interne**, conçues pour la réutilisation et le style du projet |
| **Fond** | Éléments secondaires ou répétés : végétation de remplissage, mobilier, accessoires, PNJ d'ambiance, objets décoratifs | **Banques sous licence**, retexturés et recolorés pour l'harmonie (décision D-A9) |

## 7.3. Trois scénarios

| | **S1 : 100 % interne** | **S2 : hybride (recommandé)** | **S3 : noyau resserré** |
|---|---|---|---|
| **Principe** | Tout le catalogue de la v1.0 est créé en interne | « Héros » et « kit » internes ; « fond » et animations de base issus de banques sous licence | S2 avec périmètre de contenu réduit |
| **Lot 0** | 15 à 25 j | 15 à 25 j | 15 à 25 j |
| **Lot 1** | 80 à 120 j | 55 à 85 j | 45 à 70 j |
| **Lot 2** | 150 à 250 j | 70 à 120 j | 40 à 60 j |
| **Option B** | 8 à 15 j (complète) | 6 à 10 j (allégée) | 6 à 10 j (allégée) |
| **Total** | **≈ 253 à 410 j** | **≈ 146 à 240 j** | **≈ 106 à 165 j** |
| **Durée (≈ 17 j/mois)** | **≈ 15 à 24 mois** | **≈ 9 à 14 mois** | **≈ 6 à 10 mois** |
| **Durée avec 20 % de marge** | ≈ 18 à 29 mois | ≈ 10 à 17 mois | ≈ 7 à 12 mois |

## 7.4. Contenu du périmètre resserré (S3)

| Catégorie | S2 | S3 |
|---|---|---|
| Façades et devantures | 12 à 18 | 8 à 12 |
| Modules de bâtiments | 6 à 8 | 5 à 6 |
| Intérieurs accessibles | Garage, dépôt, **1 commerce** | **Garage et dépôt seulement** |
| Arbres et plantes | 6 à 8 (banque + retouche) | 4 à 6 (banque + retouche) |
| PNJ interactifs | 7, distincts par tenue et détails | 7, **variantes d'un nombre réduit de maillages de base** |
| PNJ d'ambiance | 6 à 8 | 4 à 6 (variantes de teinte et de tenue) |
| Mobilier et accessoires | Banque + retouche | Banque + retouche, quantité réduite |
| Carcasses de véhicules | 2 à 3 | 1 à 2 |
| Repères (tour, enseigne, bannière) | 3 | 3 (indispensables à la lisibilité) |
| Interface | Écrans complets, minimap | Écrans essentiels ; minimap reportée (P1) |

## 7.5. Ma recommandation

**S2 en visant S3 comme plan de repli.** Raisons :

- S1 mobilise un an et demi à deux ans de travail sur les seuls assets, avant tests et corrections : le risque principal est d'arriver au bout avec un moteur de jeu prêt mais un monde incomplet.
- Les éléments « fond » sont ceux où la production interne apporte le moins de valeur : le joueur ne les regarde pas de près.
- Les « héros » et le « kit » restent internes : c'est là que se joue l'identité du jeu.

**Ce choix est le tien** : il dépend de ta date cible et de ce que tu considères comme *indispensable en interne*. Dis-moi si tu veux S1, S2 ou S3.

---

# 8. Licences : procédure unique

1. **Avant de télécharger** : lire la licence sur la page de l'asset (pas seulement la banque en général).
2. **Après téléchargement** : archiver une capture ou un PDF de la page et du texte de licence.
3. **Registre** : renseigner immédiatement ID, source, auteur, URL, licence, usage commercial, modification, attribution, date.
4. **Attribution** : si elle est requise, l'ajouter dans un fichier `CREDITS.md` livré avec le jeu et dans l'écran de crédits.
5. **Interdiction** d'intégrer un asset dont la licence n'est pas archivée.
6. **Retouche** : un asset retouché garde sa trace d'origine dans le registre.
7. **Revue mensuelle** : vérifier que tout asset présent dans le dépôt a une ligne au registre (script de contrôle).

Le contrôle automatique du lot 0 refuse l'intégration d'un `.glb` ou audio dont l'ID n'est pas au registre.

---

# 9. Relecteurs locaux (A7) et planning

## 9.1. Profils proposés

| Profil | Rôle |
|---|---|
| **Personne connaissant l'architecture et l'urbanisme d'Abidjan** (architecte, urbaniste, photographe, paysagiste) | Relire la crédibilité des façades, des matériaux, des couleurs, de la végétation |
| **Personne vivant ou travaillant dans un quartier commerçant** (commerçant, artisan, mécanicien) | Relire les lieux (garage, dépôt, marché), les objets, les gestes |
| **Personne maîtrisant la langue et les usages** (français ivoirien, expressions) | Relire les noms, les dialogues et les messages |

Une même personne peut tenir plusieurs profils. **Je recommande de rémunérer ces relectures** et de les cadrer par écrit (périmètre, délai, format des retours).

## 9.2. Trois moments de relecture

| Moment | Support | Question posée |
|---|---|---|
| **R1 : planches de références** (lot 0) | Moodboard, palette, croquis du plan | Le cap visuel est-il crédible, sans caricature ? |
| **R2 : prototype vertical** (fin du lot 0) | Une façade, un accessoire, un personnage au niveau final | Le style est-il juste ? Que corriger avant la production en série ? |
| **R3 : kit et dialogues** (en cours de lot 2) | Quartier assemblé, textes des PNJ | Cohérence d'ensemble, noms, dialogues |

## 9.3. Planning pour une personne

| Jalon | Contenu | Quand |
|---|---|---|
| **Lot 0** | Guide de style, conventions, squelette, test d'orientation, pipeline d'export et de validation, prototype vertical, R1 et R2 | Avant la phase 1, puis en parallèle |
| **LD-1** | Blockout du quartier avec **placeholders** ; modèle de joueur provisoire | Phase 1 |
| **LD-2 (lot 1)** | Assets de la mission 01 et du combat : joueur, Kader, gardes, pistolet, bras FPS, garage, dépôt, HUD, sons de base | Phase 2 |
| **LD-3 (lot 2)** | Kit, façades, place, marché, ateliers, PNJ, interface, sons ; R3 | Phases 2 à 5 |
| **LD-4** | Éclairage, optimisation, verrouillage | Phase 5 |

## 9.4. Ordre de production du lot 1 (une personne)

1. Squelette, joueur, animations de déplacement (banque + retouches).
2. Pistolet, objets de gameplay, bras FPS et animations FPS.
3. Garage et dépôt (extérieur, intérieur, couvertures).
4. Gardes et Kader.
5. Modules et sols du trajet garage → dépôt.
6. HUD, sons de base.
7. Place centrale et kiosque.

La **mission 01 est jouable avec de vrais assets avant** le remplissage du reste du quartier.

---

# 10. Questions restantes et décisions

| # | Question | Proposition |
|---|---|---|
| **D-A9** | Autoriser les **banques sous licence pour les modèles 3D secondaires et les animations de base** (et pas seulement pour les sons et polices) ? | **Oui**, pour le niveau « fond » (section 7.2) |
| **D-A10** | Quel scénario : S1, S2 ou S3 ? | S2, avec S3 en repli |
| **D-A11** | **Date cible** du MVP jouable ? | Nécessaire pour valider S1, S2 ou S3 |
| **D-A12** | La personne qui produit les assets fait-elle aussi du **développement** ? | Si oui, ajouter la charge de code à la section 7 |
| **D-A13** | Relecteurs locaux : qui, à quelle rémunération ? | Identifier avant R1 |
| **D-A14** | Intérieurs accessibles : **garage et dépôt seulement** (réponse à Q2 du dossier de level design) ? | Oui pour S3 ; garage, dépôt et un commerce pour S2 |
| **D-A15** | **Accord sur les budgets resserrés** de 4.5 ? | À valider par le prototype du lot 0 |

---

# 11. Impacts sur les autres documents

| Document | Mise à jour à prévoir |
|---|---|
| Cahier des charges v1.1 | Section 17 : budgets de scène sur la référence minimale (4.5) ; mention de l'option B de la vue FPS |
| Dossier de level design v1.0 | Section 13 : quantités par scénario (7.4) ; section 14 : budgets resserrés ; Q2, Q5, Q8, Q9 : réponses de ce document |
| Plan de production v1.0 | Remplacé en partie (voir tableau du début) |

---

# 12. Prochaines actions

1. **Valider** D-A9 à D-A15, au minimum D-A9, D-A10 et D-A11.
2. **Installer le pipeline** : Blender (version figée), gltf-transform, dépôt de sources avec Git LFS, registre d'assets et de licences.
3. **Réaliser le test d'orientation** et figer les conventions de la section 5.
4. **Produire le prototype vertical** (une façade, un accessoire, un personnage en PBR au niveau final), le mesurer sur la référence minimale et l'envoyer à R2.
5. **Recalibrer** les estimations après le prototype, puis lancer le lot 1.
6. **Me demander** : le script de validation des assets, le modèle du registre de licences, la fiche de contrôle du prototype vertical, ou la mise à jour du dossier de level design.
