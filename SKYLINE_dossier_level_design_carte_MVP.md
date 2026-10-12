# SKYLINE — Abidjan District
## Dossier de level design — Carte du MVP

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 12 octobre 2026 |
| **Document parent** | Cahier des charges v1.1 |
| **Périmètre** | Quartier jouable de 300 m × 300 m, MVP uniquement |
| **Monnaie** | Le Djai |
| **Statut** | Proposition de conception, à valider par un blockout jouable |

> **Statut des valeurs.** Toutes les positions, distances, dimensions et budgets de ce dossier sont des **points de départ de conception**. Ils seront ajustés pendant le blockout (jalon LD-1) et validés par des tests de performance. Les noms de rues, de lieux et de personnages sont **fictifs et provisoires** ; ils doivent être relus par des personnes connaissant bien le contexte ivoirien avant production.

---

# 1. Objet du document

Ce dossier décrit **ce qu'il faut produire pour la carte du MVP** et le décrit assez précisément pour pouvoir commencer le blockout (volumes gris) immédiatement :

- le plan du quartier et ses règles de construction ;
- les lieux fonctionnels et leurs positions ;
- les placements gameplay (PNJ, gardes, objets, zones) ;
- les formats de fichiers lus par le client et le serveur ;
- la collision et la navigation ;
- le guide de style, la liste d'assets et les budgets techniques ;
- le plan de production par jalons et les critères de validation.

## 1.1. Rappel des contraintes issues du cahier des charges

- Quartier compact de **300 m × 300 m**, traversée à pied en **2 à 4 minutes**.
- **Pas de véhicule conduisible**, pas de police.
- 7 lieux fonctionnels obligatoires.
- **8 joueurs** par session (test à 12).
- Missions et objectifs **individuels** : les entités de mission d'un joueur ne sont pas visibles des autres (hypothèse H3).
- Tous les objectifs sont **accessibles à pied** ; les raccourcis sont lisibles ; les limites empêchent les sorties accidentelles.
- Peu de bâtiments accessibles, éléments répétés **instanciés**.
- La géométrie de collision est **simplifiée et lisible par le serveur** (section 14.9 du cahier des charges).

---

# 2. Conventions

## 2.1. Repère et unités

| Convention | Valeur |
|---|---|
| Unité | Mètre |
| Origine (0, 0) | Coin sud-ouest du quartier |
| Axe `x` | Vers l'est (0 → 300) |
| Axe `z` | Vers le nord (0 → 300) |
| Axe `y` | Vers le haut ; **sol à y = 0** |
| Orientation `yaw` | En degrés ; **0° = nord (+z)**, 90° = est (+x) |
| Sol | **Plat** dans le MVP (voir 11.1) |

Les conversions éventuelles vers le repère interne du moteur sont faites **à un seul endroit** (chargeur de carte), jamais dans les données.

## 2.2. Secteurs de chargement

Le quartier est découpé en **9 secteurs de 100 m × 100 m**, utilisés pour le chargement progressif et le culling.

| | **x 0–100** (A) | **x 100–200** (B) | **x 200–300** (C) |
|---|---|---|---|
| **z 200–300** (3) | A3 | B3 | C3 (dépôt) |
| **z 100–200** (2) | A2 (marché) | B2 (place) | C2 |
| **z 0–100** (1) | A1 (garage) | B1 | C1 (ateliers) |

## 2.3. Nommage des identifiants

| Préfixe | Objet | Exemple |
|---|---|---|
| `SP-` | Point d'apparition | `SP-01` |
| `SZ-` | Zone sûre | `SZ-GARAGE` |
| `NPC-` | PNJ interactif | `NPC-KADER` |
| `GD-` | Garde | `GD-01` |
| `AC-` | Caisse de munitions | `AC-03` |
| `TR-` | Déclencheur (trigger) | `TR-DEPOT-ENTER` |
| `LIV-` / `OBJ-` / `SRV-` | Occurrences de livraison / recherche / service | `LIV-02` |
| `MS-` | Mission | `MS-01` |
| `CI-` | Cour intérieure | `CI-01` |

---

# 3. Plan du quartier

## 3.1. Plan de principe (grille de 10 m)

Chaque caractère représente **10 m × 10 m**. C'est une représentation de principe : les rues réelles font de 8 à 14 m de large, avec trottoirs. Le nord est en haut.

```text
      000000000011111111112222222222
      012345678901234567890123456789
z290  ##############################
z280  #............................#
z270  #............................#
z260  #.............=.....=........#
z250  #.............=.....=........#
z240  #.............=.....=........#
z230  #.==========================.#
z220  #.............=.....C.rDDDD..#
z210  #.............=.....C.rDDDD..#
z200  #.....MMMMMM..=.....C.rDDDD..#
z190  #.....MMMMMM..=.....C.r......#
z180  #.....MMMMMM..=rrrrrC.r......#
z170  #.....MMMMMM..=.....C.r......#
z160  #.....MMMMMM..=.....C.r......#
z150  #............PPP....C.r......#
z140  #============PPP=============#
z130  #.......=..r.PPP..K.C........#
z120  #.......=..r..=.....C........#
z110  #.......=..r..=.....C........#
z100  #.......=..r..=.....C........#
z090  #....GGG=..r..=.....C........#
z080  #....GGG=..r..=.....C........#
z070  #....GGG====================.#
z060  #.......=.....=.....CAAAAA...#
z050  #.......=.....=.....=AAAAA...#
z040  #.......=.....=.....=AAAAA...#
z030  #.......=.....=.....=........#
z020  #............................#
z010  #............................#
z000  ##############################
```

| Symbole | Signification |
|---|---|
| `#` | Limite du quartier (barrière physique, voir 11.3) |
| `.` | Îlots bâtis : bâtiments, façades, cours, végétation |
| `=` | Rue carrossable (piétons seuls dans le MVP) |
| `C` | Rue commerçante |
| `r` | Ruelle piétonne / raccourci |
| `P` | Place centrale |
| `G` | Garage de Kader |
| `D` | Dépôt de pièces |
| `M` | Marché de quartier |
| `A` | Cour des ateliers |
| `K` | Point de vente de munitions |

## 3.2. Voies

| ID | Nom provisoire | Type | Tracé approximatif | Largeur indicative |
|---|---|---|---|---|
| V-01 | Avenue des Flamboyants | Axe est-ouest principal | z 140–150, x 10–290 | 12 à 14 m |
| V-02 | Rue du Marché | Axe nord-sud principal | x 140–150, z 30–270 | 10 m |
| V-03 | Rue du Commerce | Rue commerçante | x 200–210, z 30–270 (tronçon commerçant z 60–230) | 10 m |
| V-04 | Rue des Ateliers | Rue secondaire sud-ouest | x 80–90, z 30–150 | 8 m |
| V-05 | Rue de la Cour | Rue secondaire sud | z 70–80, x 80–280 | 8 m |
| V-06 | Rue des Manguiers | Rue secondaire nord | z 230–240, x 20–280 | 8 m |

## 3.3. Ruelles et raccourcis piétons

| ID | Tracé | Rôle |
|---|---|---|
| R-01 | x 110–120, z 80–140 | Relie la rue des Ateliers au sud-ouest de la place ; raccourci garage → place |
| R-02 | z 180–190, x 150–200 | Relie la rue du Marché à la rue du Commerce au nord de la place ; accès à l'objet `OBJ-03` |
| R-03 | x 220–230, z 150–230 | Relie l'avenue à l'**entrée ouest du dépôt** ; raccourci vers la mission 01 |

Les ruelles sont **lisibles** : élargissement visuel à l'entrée, enseigne ou marquage au sol, éclairage plus clair qu'à l'intérieur de l'îlot.

## 3.4. Cours intérieures

| ID | Nom provisoire | Position | Taille | Accès |
|---|---|---|---|---|
| CI-01 | Cour du Tamarinier | Centre (165, 45) | ~20 × 20 m | Passage depuis la rue du Marché, côté est, à z ≈ 45 |
| CI-02 | Cour du Manguier | Centre (170, 255) | ~25 × 20 m | Passage depuis la rue des Manguiers, côté nord, à x ≈ 170 |
| CI-03 | Arrière du marché | Centre (130, 205) | ~20 × 20 m | Ouvert sur la bande libre entre le marché et la rue du Marché |

## 3.5. Silhouette et repères visuels

Le joueur doit pouvoir s'orienter sans la carte.

| Repère | Position | Fonction |
|---|---|---|
| **Grand arbre de la place** (fromager ou équivalent) | Place centrale, (145, 145) | Repère principal, visible de loin |
| **Château d'eau ou tour de télécommunications** | Nord-est, vers (270, 260) | Repère lointain, aide à s'orienter vers le dépôt |
| **Enseigne géante du garage** | Garage, (65, 100) | Repère sud-ouest |
| **Bannière ou toit coloré du marché** | Marché, (90, 185) | Repère nord-ouest |
| **Silhouette de hangar** | Dépôt, (260, 215) | Repère nord-est, couleur différente (zone dangereuse) |

---

# 4. Lieux fonctionnels

## 4.1. Garage de Kader — secteur A1

| | |
|---|---|
| **Emprise** | x 50–80, z 70–100 (≈ 30 × 30 m) |
| **Entrée principale** | (80, 85), sur la rue des Ateliers |
| **Rôle** | Départ et fin de la mission 01, zone sûre |
| **Intérieur accessible** | Oui : atelier ouvert (un seul volume) et cour |
| **Contenu** | Établi, outils, pièces suspendues, carcasses de véhicules à l'arrêt (explique l'absence de véhicule conduisible), enseigne |
| **PNJ** | `NPC-KADER` à (65, 85) |
| **Zone sûre** | `SZ-GARAGE` |
| **Caisse de munitions** | `AC-01` dans la cour |

## 4.2. Dépôt de pièces — secteur C3

| | |
|---|---|
| **Emprise** | x 230–270, z 200–230 (40 × 30 m) |
| **Entrées** | Portail nord, sur la rue des Manguiers, vers (250, 230) ; portail ouest, sur la ruelle R-03, vers (230, 215) |
| **Rôle** | Zone de combat de la mission 01 |
| **Intérieur accessible** | Cour clôturée avec **hangar ouvert** (côté est, x 258–270, z 200–212) |
| **Contenu** | Palettes, fûts, caisses empilées servant de **couvertures**, grillage |
| **Gardes** | `GD-01`, `GD-02` (propres à chaque joueur) |
| **Objet de mission** | Sac de pièces, dans le hangar, à (264, 203) |
| **Contraintes** | Pas de recoin où le joueur peut se coincer ; deux entrées pour éviter un combat à sens unique ; la cour est lisible depuis les deux portails |

## 4.3. Marché de quartier — secteur A2

| | |
|---|---|
| **Emprise** | x 60–120, z 160–210 |
| **Rôle** | Ambiance, rencontres, découverte d'activités |
| **Contenu** | Étals et auvents colorés, allées étroites mais franchissables, zone dégagée vers la rue du Marché, bande libre au nord et à l'est (CI-03) |
| **PNJ interactifs** | `NPC-ADJOUA`, `NPC-MARIAM`, `NPC-AYA` |
| **PNJ d'ambiance** | 4 à 6 (voir 8.3) |
| **Sécurité** | Zone sûre `SZ-MARCHE` |

## 4.4. Rue commerçante — secteurs B/C

| | |
|---|---|
| **Emprise** | Rue du Commerce, tronçon z 60–230 |
| **Rôle** | Itinéraires de livraison, services de quartier |
| **Contenu** | Boutiques et façades reconnaissables (6 à 10 façades différentes assemblées à partir du kit), enseignes peintes, étals sur les trottoirs |
| **PNJ interactifs** | `NPC-YAO` à (196, 112) |

## 4.5. Cour des ateliers — secteur C1

| | |
|---|---|
| **Emprise** | x 210–260, z 40–70, accès par la rue de la Cour |
| **Rôle** | Recherche d'objets, services de quartier |
| **Contenu** | Menuiserie, soudure, couture ou réparation (selon l'art), outils et matériaux, objets interactifs prédéfinis |
| **PNJ interactifs** | `NPC-KONAN` à (235, 55) |

## 4.6. Point de vente de munitions — secteur B2

| | |
|---|---|
| **Position** | Kiosque à (185, 135), côté sud de l'avenue, près de la rue du Commerce |
| **Rôle** | Achat de lots de 12 cartouches à 100 Djai |
| **Contenu** | Kiosque ou boutique avec comptoir bien identifiable, signalétique discrète (pas d'imagerie d'armes agressive) |
| **PNJ** | `NPC-BAKARY` |
| **Zone sûre** | Oui |

> **Point de vigilance.** Le vendeur de munitions doit rester lisible comme un point de jeu sans caricaturer le quartier. Le traitement visuel (kiosque générique, enseigne neutre) est à valider avec le guide de style.

## 4.7. Place centrale — secteur B2

| | |
|---|---|
| **Emprise** | Centre (145, 145), ≈ 40 × 40 m au croisement de l'avenue et de la rue du Marché |
| **Rôle** | Repère principal, point de rencontre, point d'apparition |
| **Contenu** | Grand arbre, bancs, abris, éclairage, quelques PNJ d'ambiance |
| **Zone sûre** | `SZ-PLACE` |

---

# 5. Parcours et distances

## 5.1. Hypothèses de vitesse (à valider)

| Allure | Vitesse |
|---|---|
| Marche | 3 m/s |
| Sprint | 6 m/s |

Ces vitesses sont des **hypothèses de calcul** ; la vitesse du personnage reste un point ouvert du cahier des charges. Les longueurs ci-dessous sont des **longueurs de parcours le long des rues**, pas des distances à vol d'oiseau.

## 5.2. Parcours clés

| Trajet | Longueur approximative | Marche | Sprint |
|---|---:|---:|---:|
| Garage (80, 85) → place centrale | ~ 125 m | ~ 40 s | ~ 20 s |
| Garage → dépôt par la ruelle R-03 (route courte) | ~ 275 m | ~ 90 s | ~ 45 s |
| Garage → dépôt par la rue du Commerce et la rue des Manguiers (route longue) | ~ 335 m | ~ 110 s | ~ 55 s |
| Coin sud-ouest → coin nord-est (par les rues) | ~ 560 m | ~ 3 min | ~ 1 min 30 |

La traversée la plus longue du quartier est donc de **l'ordre de 3 minutes à la marche**, dans la fourchette cible de 2 à 4 minutes.

## 5.3. Cohérence avec la durée de la mission 01

| Étape | Durée estimée |
|---|---:|
| Dialogue avec Kader | 0 min 30 |
| Trajet aller | 1 min 30 à 2 min |
| Combat contre les deux gardes | 1 à 2 min |
| Récupération du sac | 0 min 15 |
| Trajet retour | 1 min 30 à 2 min |
| Retour chez Kader | 0 min 30 |
| **Total** | **≈ 5 à 7 min** |

C'est cohérent avec la durée cible de 5 à 8 minutes.

---

# 6. Mission 01 sur la carte

| Élément | Identifiant | Position / valeur |
|---|---|---|
| Donneur | `NPC-KADER` | (65, 0, 85), dans le garage |
| Marqueur d'objectif initial | — | Zone du dépôt, centre (250, 215) |
| Déclencheur d'hostilité | `TR-DEPOT-ENTER` | Boîte x 230–270, z 200–230 |
| Garde 1 | `GD-01` | Apparition (246, 0, 214) |
| Garde 2 | `GD-02` | Apparition (258, 0, 220) |
| Sac de pièces | `MS01-BAG` | (264, 0, 203), dans le hangar |
| Retour | `NPC-KADER` | Même position |

## 6.1. Règles propres à la carte

- Le déclencheur est évalué **par joueur** ; les gardes créés par un joueur ne sont visibles et ne peuvent être blessés que par lui.
- Le sac n'est récupérable qu'une fois les deux gardes neutralisés ; il est **propre au joueur**.
- Deux joueurs dans le dépôt en même temps voient chacun **leurs propres gardes** et pas ceux de l'autre (voir 9).
- Après la mort du joueur, la mission revient à l'étape **précédant l'entrée dans le dépôt** (règle du cahier des charges, 7.5).
- Aucune réapparition ne doit se faire à moins de 80 m du dépôt.

## 6.2. Combat

- Les gardes patrouillent sur 4 à 5 points dans la cour et le hangar.
- Les couvertures sont des **volumes simples** (caisses, palettes, fûts) disposés pour que le joueur puisse se protéger sans bloquer la ligne de vue en permanence.
- La distance de détection de secours est de **15 m** (valeur initiale), mais l'hostilité est surtout déclenchée par l'entrée dans la zone.

---

# 7. Activités secondaires : placements

Chaque type d'activité dispose de **plusieurs occurrences** pour éviter la répétition immédiate. Une occurrence se verrouille pendant 5 minutes après réussite (par joueur) ; le joueur peut en réaliser une autre entre-temps.

## 7.1. Petites livraisons — 100 Djai

| ID | Donneur | Récupération du colis | Destinataire | Longueur de parcours | Durée estimée |
|---|---|---|---|---:|---:|
| `LIV-01` | `NPC-YAO` | (196, 0, 112) | `NPC-MARIAM` (78, 0, 190) | ~ 210 m | 1 min 30 |
| `LIV-02` | `NPC-ADJOUA` | (100, 0, 172) | `NPC-KONAN` (235, 0, 55) | ~ 255 m | 2 min |
| `LIV-03` | `NPC-KONAN` | (235, 0, 55) | `NPC-KADER` (66, 0, 82) | ~ 175 m | 1 min 30 |

## 7.2. Recherche d'objets — 75 Djai

| ID | Donneur | Zone de recherche | Objet (position) | Indice |
|---|---|---|---|---|
| `OBJ-01` | `NPC-AYA` | Cercle (130, 205), rayon 15 m (CI-03) | (134, 0, 208) | Reflet visuel, objet au pied d'un mur |
| `OBJ-02` | `NPC-KONAN` | Cercle (165, 45), rayon 18 m (CI-01) | (166, 0, 50) | Objet posé sur une caisse |
| `OBJ-03` | `NPC-YAO` | Cercle (175, 185), rayon 12 m (R-02) | (172, 0, 186) | Objet près d'un mur de ruelle |

Règles : l'objet n'est **interactif que pour le joueur concerné et uniquement pendant l'activité** ; entrer dans la zone ne suffit pas ; le joueur doit l'interagir puis le rapporter.

## 7.3. Services de quartier — 150 Djai

| ID | Donneur | Récupération | Dépôt | Durée estimée |
|---|---|---|---|---:|
| `SRV-01` | `NPC-YAO` | (214, 0, 85) | (196, 0, 175) | 2 min |
| `SRV-02` | `NPC-MARIAM` | (74, 0, 155) | (128, 0, 198) | 2 min |

Les distances de `SRV-01` et `SRV-02` sont courtes : si les durées réelles tombent sous la fourchette de 2 à 4 minutes, on **allonge le trajet ou on ajoute une étape** pendant les tests plutôt que de changer la récompense.

## 7.4. Équilibre territorial des activités

Pour que les activités mènent le joueur dans tout le quartier :

- au moins une activité de départ ou d'arrivée dans **chacun** des secteurs A2, B2, B3, C1 et C2 ;
- aucune activité ne mène le joueur dans la **zone du dépôt** (réservée à la mission 01) ;
- aucune activité ne passe par un lieu où un joueur peut se retrouver bloqué.

---

# 8. PNJ, apparitions, zones sûres et caisses

## 8.1. Points d'apparition

| ID | Emplacement | Position | Orientation |
|---|---|---|---:|
| `SP-01` | Place centrale, côté sud | (145, 0, 122) | 0° |
| `SP-02` | Devant le garage | (86, 0, 100) | 90° |
| `SP-03` | Bord est du marché | (128, 0, 178) | 270° |
| `SP-04` | Avenue, près du kiosque | (176, 0, 146) | 180° |

Règles :
- Le serveur choisit le point **le moins occupé** parmi ceux disponibles.
- Un point n'est pas utilisable si un autre joueur est à moins de **3 m**.
- Le **premier apparition** se fait de préférence à `SP-01` (la place centrale est le meilleur point de découverte).
- À la réapparition après mort : point sûr le plus éloigné du lieu de la mort, avec règle de **distance minimale de 80 m du dépôt** pendant la mission 01.

## 8.2. Zones sûres

| ID | Forme | Emprise |
|---|---|---|
| `SZ-GARAGE` | Boîte | x 50–90, z 70–100 |
| `SZ-PLACE` | Cercle | Centre (145, 145), rayon 25 m |
| `SZ-MARCHE` | Boîte | x 60–120, z 160–210 |
| `SZ-KIOSQUE` | Cercle | Centre (185, 135), rayon 10 m |

Dans une zone sûre : aucune apparition d'ennemi, aucun déclencheur de mission hostile. Le **tir reste possible** (pas de PvP dans le MVP) mais les gardes de mission n'y pénètrent pas.

## 8.3. PNJ interactifs

| ID | Nom provisoire | Rôle | Position |
|---|---|---|---|
| `NPC-KADER` | Kader | Mécanicien, mission 01 | (65, 0, 85) |
| `NPC-BAKARY` | Bakary | Vendeur de munitions | (185, 0, 135) |
| `NPC-YAO` | Yao | Commerçant : livraisons, services, objets | (196, 0, 112) |
| `NPC-ADJOUA` | Adjoua | Marchande : livraisons | (100, 0, 172) |
| `NPC-MARIAM` | Mariam | Couturière : livraisons, services | (78, 0, 190) |
| `NPC-AYA` | Aya | Habitante : recherche d'objets | (112, 0, 190) |
| `NPC-KONAN` | Konan | Artisan : livraisons, objets | (235, 0, 55) |

Les noms sont **provisoires** (voir encadré du début).

## 8.4. PNJ d'ambiance

- **10 à 15** PNJ d'ambiance au total, répartis sur la carte (marché, place, rue commerçante, cours).
- Boucles d'animation simples (discussion, attente, marche sur un court trajet).
- **Recommandation :** les PNJ d'ambiance sont **purement visuels côté client** : ni synchronisés par le réseau, ni interactifs. Ils réduisent le coût serveur et la bande passante. Conséquence acceptée : deux joueurs ne voient pas exactement la même foule.

## 8.5. Caisses de munitions

Caisses **personnelles par joueur** (chaque joueur voit et utilise sa propre caisse).

| ID | Emplacement | Position |
|---|---|---|
| `AC-01` | Cour du garage | (60, 0, 74) |
| `AC-02` | Sud, cour du Tamarinier | (160, 0, 52) |
| `AC-03` | Avenue, côté nord | (197, 0, 152) |
| `AC-04` | Rue des Manguiers | (165, 0, 232) |
| `AC-05` | Approche du dépôt, ruelle R-03 | (225, 0, 200) |

Quantité par caisse : 12 cartouches. Le **délai de réapparition de la caisse** après usage n'est pas défini : **proposition de 5 minutes**, alignée sur le délai des activités, à valider.

---

# 9. Contraintes liées au multijoueur

## 9.1. Densité

- 8 joueurs dans 90 000 m² laissent beaucoup d'espace ; la densité sera plutôt **trop faible que trop forte**. Le quartier doit donc être animé par les PNJ et par les activités plutôt que par la seule présence des joueurs.
- Les points de rencontre (place, marché, kiosque) doivent pouvoir accueillir **8 joueurs sans encombrement** (≥ 10 m de dégagement).

## 9.2. Entités privées

- Les gardes, le sac et les objets d'activité n'existent **que pour le joueur concerné**.
- Un autre joueur peut traverser le dépôt et voir une cour **vide**. C'est un effet connu et accepté dans le MVP ; il doit être signalé en test pour juger de l'acceptabilité.
- Les entités privées **ne bloquent pas** les autres joueurs (pas de collision avec les entités d'un autre joueur).

## 9.3. Occupation des PNJ interactifs

- Les PNJ sont **partagés visuellement** mais leur dialogue est **individuel** : deux joueurs peuvent parler à Yao en même temps.
- Aucune file d'attente ni verrouillage de PNJ.

## 9.4. Dispersion

- Aucun point de passage obligatoire que les joueurs devraient **partager** (goulot) ; la rue du Marché et la rue du Commerce offrent des alternatives.
- Les itinéraires entre points de départ de mission et d'activité utilisent **au moins deux chemins** différents.

---

# 10. Fichiers de données de la carte

Les données de placement sont stockées dans `packages/game-config/` et lues **par le client et par le serveur** (une seule source de vérité). Elles sont validées par un schéma au chargement ; une donnée invalide empêche le démarrage.

```text
packages/game-config/
├── world/
│   ├── world.json           # limites, secteurs, zones, points d'apparition
│   ├── npcs.json            # PNJ interactifs et d'ambiance
│   ├── missions.json        # définitions des missions (MS-01)
│   ├── activities.json      # définitions et occurrences des activités
│   ├── pickups.json         # caisses de munitions
│   ├── collision.json       # géométrie de collision (voir 11)
│   └── navigation.json      # points de patrouille et chemins (voir 11)
└── balance/
    └── economy.json         # prix, récompenses, délais
```

## 10.1. `world.json` (extrait)

```json
{
  "version": 1,
  "units": "meters",
  "origin": "south-west",
  "bounds": { "min": [0, 0], "max": [300, 300] },
  "sectors": { "size": 100, "ids": ["A1","B1","C1","A2","B2","C2","A3","B3","C3"] },
  "spawn_points": [
    { "id": "SP-01", "position": [145, 0, 122], "yaw": 0,   "safe_radius": 5 },
    { "id": "SP-02", "position": [86,  0, 100], "yaw": 90,  "safe_radius": 5 },
    { "id": "SP-03", "position": [128, 0, 178], "yaw": 270, "safe_radius": 5 },
    { "id": "SP-04", "position": [176, 0, 146], "yaw": 180, "safe_radius": 5 }
  ],
  "safe_zones": [
    { "id": "SZ-GARAGE",  "shape": "box",    "min": [50, 70],  "max": [90, 100] },
    { "id": "SZ-PLACE",   "shape": "circle", "center": [145, 145], "radius": 25 },
    { "id": "SZ-MARCHE",  "shape": "box",    "min": [60, 160], "max": [120, 210] },
    { "id": "SZ-KIOSQUE", "shape": "circle", "center": [185, 135], "radius": 10 }
  ],
  "respawn_rules": {
    "min_distance_from_depot_during_ms01": 80,
    "min_distance_from_other_player": 3
  }
}
```

## 10.2. `npcs.json` (extrait)

```json
{
  "version": 1,
  "interactive": [
    { "id": "NPC-KADER",  "name": "Kader",  "role": "mission_giver", "position": [65, 0, 85],  "yaw": 90,  "interaction_radius": 2.5 },
    { "id": "NPC-BAKARY", "name": "Bakary", "role": "ammo_vendor",   "position": [185, 0, 135], "yaw": 0,   "interaction_radius": 2.5 },
    { "id": "NPC-YAO",    "name": "Yao",    "role": "activity_giver","position": [196, 0, 112], "yaw": 90,  "interaction_radius": 2.5 }
  ],
  "ambient": { "count_target": 12, "networked": false, "interactive": false }
}
```

## 10.3. `missions.json` (extrait de `MS-01`)

```json
{
  "id": "MS-01",
  "title": "Une livraison qui tourne mal",
  "giver": "NPC-KADER",
  "reward": { "currency": "djai", "amount": 500, "reputation": 100, "first_completion_only": true },
  "trigger": { "id": "TR-DEPOT-ENTER", "shape": "box", "min": [230, 200], "max": [270, 230] },
  "enemies": [
    { "id": "GD-01", "spawn": [246, 0, 214], "patrol": [[240,0,208],[256,0,208],[256,0,222],[240,0,222]], "hostile_on": "zone_enter" },
    { "id": "GD-02", "spawn": [258, 0, 220], "patrol": [[262,0,222],[262,0,208],[248,0,206]],           "hostile_on": "zone_enter" }
  ],
  "objective_item": { "id": "MS01-BAG", "position": [264, 0, 203], "requires": "all_enemies_neutralized" },
  "failure": { "on_death": "reset_to_step_before_depot_entry" },
  "loot_on_replay": false
}
```

## 10.4. `activities.json` (extrait)

Les champs reprennent la structure définie au cahier des charges (10.6).

```json
{
  "version": 1,
  "activities": [
    {
      "activity_id": "LIV-01",
      "type": "delivery",
      "start_location": { "npc": "NPC-YAO", "position": [196, 0, 112] },
      "discovery_mode": "map_and_exploration",
      "reward_amount": 100,
      "cooldown_seconds": 300,
      "is_repeatable": true,
      "steps": [
        { "id": "accept",  "type": "interact", "target": "NPC-YAO" },
        { "id": "pickup",  "type": "pickup",   "position": [196, 0, 112], "radius": 2.5 },
        { "id": "deliver", "type": "interact", "target": "NPC-MARIAM" }
      ]
    },
    {
      "activity_id": "OBJ-01",
      "type": "lost_object",
      "start_location": { "npc": "NPC-AYA", "position": [112, 0, 190] },
      "discovery_mode": "exploration",
      "reward_amount": 75,
      "cooldown_seconds": 300,
      "is_repeatable": true,
      "steps": [
        { "id": "accept", "type": "interact", "target": "NPC-AYA" },
        { "id": "search", "type": "search_zone", "center": [130, 205], "radius": 15 },
        { "id": "find",   "type": "pickup", "position": [134, 0, 208], "radius": 2.0 },
        { "id": "return", "type": "interact", "target": "NPC-AYA" }
      ]
    },
    {
      "activity_id": "SRV-01",
      "type": "neighborhood_service",
      "start_location": { "npc": "NPC-YAO", "position": [196, 0, 112] },
      "discovery_mode": "exploration",
      "reward_amount": 150,
      "cooldown_seconds": 300,
      "is_repeatable": true,
      "steps": [
        { "id": "accept",  "type": "interact", "target": "NPC-YAO" },
        { "id": "pickup",  "type": "pickup",   "position": [214, 0, 85], "radius": 2.5 },
        { "id": "drop",    "type": "dropoff",  "position": [196, 0, 175], "radius": 2.5 },
        { "id": "confirm", "type": "interact", "target": "NPC-YAO" }
      ]
    }
  ]
}
```

Notes :
- `discovery_mode` : `map_and_exploration` signifie que l'activité peut être découverte à la fois par un PNJ et par un marqueur de carte (marqueur : P1). Sans la carte P1, seule la découverte par PNJ s'applique.
- Les **rayons d'interaction** sont des valeurs de départ (à valider avec la caméra TPS/FPS).
- Le serveur **revérifie chaque position** ; le client n'est jamais cru sur la proximité.

## 10.5. `pickups.json` (extrait)

```json
{
  "ammo_crates": [
    { "id": "AC-01", "position": [60,  0, 74],  "amount": 12, "per_player": true },
    { "id": "AC-02", "position": [160, 0, 52],  "amount": 12, "per_player": true },
    { "id": "AC-03", "position": [197, 0, 152], "amount": 12, "per_player": true },
    { "id": "AC-04", "position": [165, 0, 232], "amount": 12, "per_player": true },
    { "id": "AC-05", "position": [225, 0, 200], "amount": 12, "per_player": true }
  ],
  "respawn_seconds": 300
}
```

## 10.6. Règles de validation des données

Au chargement, un contrôle automatique vérifie :
- chaque position est **dans les limites** (0–300) et **hors volume de collision** ;
- chaque PNJ, objet et point d'apparition est **accessible à pied** depuis un point d'apparition (parcours vérifié sur les données de navigation) ;
- chaque identifiant est **unique** et chaque référence existe ;
- aucune occurrence d'activité n'a de cible dans la zone du dépôt ;
- les montants correspondent à `economy.json`.

---

# 11. Collision et navigation

## 11.1. Sol plat et dénivelés

Pour que la prédiction côté client et la validation côté serveur restent simples et cohérentes :

- le sol est **plat (y = 0)** dans le MVP ;
- les dénivelés sont limités à des **marches et trottoirs** modélisés par des volumes simples ;
- aucune pente complexe, aucune toiture praticable, aucun étage accessible dans le MVP.

## 11.2. Format de collision

La géométrie de collision est **séparée du visuel** et décrite par des volumes simples.

```json
{
  "version": 1,
  "ground": { "y": 0 },
  "boxes": [
    { "id": "B-GARAGE-N", "center": [65, 3, 100], "size": [30, 6, 0.5], "yaw": 0 },
    { "id": "B-DEPOT-CRATE-01", "center": [248, 0.6, 212], "size": [1.2, 1.2, 1.2], "yaw": 15, "cover": true }
  ]
}
```

Règles :
- volumes de type **boîte orientée** (avec rotation autour de y), éventuellement cylindres pour les poteaux et arbres ;
- le serveur et le client utilisent **le même fichier** et le même contrôleur cinématique (`packages/shared`) ;
- les volumes de **couverture** sont marqués (`cover`) pour l'IA des gardes ;
- les murs de collision sont **légèrement plus épais** que le visuel pour éviter les passages à travers ;
- les collisions de décor purement décoratif (câbles, enseignes hautes, végétation haute) sont **exclues**.

## 11.3. Limites du quartier

- Barrière physique continue sur tout le pourtour, **intégrée à la mise en scène** (murs d'enceinte, rangées de bâtiments, clôtures, végétation dense) pour éviter l'effet « mur invisible ».
- Volume de sécurité : un joueur projeté hors limites est **ramené au point d'apparition le plus proche** par le serveur.
- Hauteur minimale des barrières : **4 m** (saut compris).

## 11.4. Navigation

- Pour le MVP, les gardes utilisent des **points de patrouille** (waypoints) avec évitement simple des obstacles. Un **maillage de navigation (navmesh)** n'est pas obligatoire.
- Un graphe de **chemins piétons** est exporté pour valider l'accessibilité et pour l'éventuel guidage des PNJ.
- Les PNJ interactifs sont **immobiles ou à courte boucle** (pas de déplacement libre).

```json
{
  "version": 1,
  "patrol_routes": [
    { "id": "PR-GD-01", "owner": "GD-01", "loop": true,
      "points": [[240,0,208],[256,0,208],[256,0,222],[240,0,222]] }
  ],
  "walkable_graph": { "nodes": "...", "edges": "..." }
}
```

## 11.5. Anti-blocage

- Aucun passage de moins de **1,2 m** de large.
- Aucun **angle fermé** où la capsule du joueur peut être coincée.
- Aucune **marche** de plus de 0,4 m sans rampe.
- Test automatique : balayage de la carte par une capsule de joueur pour détecter les poches inaccessibles ou piégeantes.

---

# 12. Direction artistique du quartier

## 12.1. Intentions

- Un quartier **vivant, chaleureux, crédible** : mélange de commerces, d'ateliers, d'habitations basses et moyennes, de petites cours, de végétation tropicale.
- **Inspiré** de l'urbanisme et de l'architecture de la Côte d'Ivoire, **sans caricature** ni reproduction d'un quartier réel.
- Lisibilité avant tout : le joueur doit repérer les lieux, les PNJ importants et les objectifs.

## 12.2. Éléments typiques à explorer (à valider avec des conseillers locaux)

- Bâtiments bas et moyens (R+0 à R+3), façades enduites et peintes, toitures en tôle ou terrasses, auvents, murs d'enceinte.
- Enseignes peintes à la main, mobilier commerçant, étals, parasols, bâches.
- Végétation : manguiers, flamboyants, palmiers, plantes en pots, parterres.
- Réseaux visibles (poteaux, câbles) en nombre limité.
- Sols : bitume usé, terre battue, dalles, trottoirs irréguliers.

> **À éviter.** Clichés misérabilistes, exotisme gratuit, logos et enseignes de marques réelles, reproduction littérale d'un lieu identifiable. Les relectures de style par des personnes connaissant le contexte sont **un jalon de production**, pas un détail.

## 12.3. Palette et matériaux

- Palette **chaude et variée** pour les façades ; contraste suffisant pour distinguer les lieux fonctionnels.
- **Couleur dédiée** à la zone du dépôt (teintes plus froides ou plus ternes) pour signaler un changement d'ambiance.
- **Peu de matériaux différents** (voir budgets) : atlas partagés pour les façades et les accessoires.

## 12.4. Éléments à ne pas produire dans le MVP

- Véhicules conduisibles (les carcasses du garage sont **immobiles et non interactives**).
- Intérieurs détaillés au-delà du garage, du dépôt et, au maximum, d'un ou deux commerces.
- Cycle jour/nuit, météo dynamique.
- Foule dense animée côté serveur.

---

# 13. Liste des assets à produire

Les quantités sont **indicatives** et servent à estimer la charge de production.

## 13.1. Architecture

| Catégorie | Quantité indicative | Remarque |
|---|---:|---|
| Modules de bâtiments (volumes de base R+0 à R+3) | 6 à 10 | Assemblés et réutilisés |
| Façades variées (devantures, enseignes, portes, fenêtres) | 15 à 25 | Textures atlas |
| Toitures et auvents | 6 à 8 | Instanciés |
| Murs d'enceinte et clôtures | 4 à 6 | Aussi utilisés pour les limites |
| Intérieurs accessibles | 2 à 4 | Garage, dépôt, 1 à 2 commerces |

## 13.2. Environnement

| Catégorie | Quantité indicative |
|---|---:|
| Revêtements de sol (route, trottoir, terre, dalles) | 5 à 8 |
| Arbres et plantes | 6 à 10 modèles |
| Mobilier urbain (bancs, poteaux, panneaux, poubelles, bornes) | 10 à 15 |
| Étals, bâches, parasols, caisses, palettes | 15 à 20 |
| Carcasses de véhicules (immobiles) | 2 à 3 |
| Éléments de repère (château d'eau ou tour, enseigne géante, grand arbre) | 3 à 5 |
| Ciel | 1 |

## 13.3. Personnages et objets

| Catégorie | Quantité indicative |
|---|---:|
| Joueur (modèle de base + variantes limitées) | 1 à 2 |
| PNJ interactifs (Kader, Bakary, Yao, Adjoua, Mariam, Aya, Konan) | 7 |
| Gardes | 2 modèles ou 1 modèle + variantes |
| PNJ d'ambiance | 6 à 10 modèles |
| Animations : repos, marche, course, saut, accroupi, visée, tir, rechargement, interaction, mort, dialogue | ~ 11 de base |
| Objets de gameplay : pistolet, sac, colis, caisse de munitions, objets perdus, matériel | 8 à 12 |

## 13.4. Sons liés à la carte

Ambiance par zone (marché, rue commerçante, atelier, place), sons de pas selon la surface (bitume, terre, dalle), sons d'interaction et de validation.

---

# 14. Budgets techniques

> **Rappel.** Ces budgets sont des **points de départ**, à confirmer par des mesures sur la machine de référence (non encore définie). Ils servent de garde-fous dès le blockout.

## 14.1. Scène

| Budget | Valeur de départ |
|---|---|
| Triangles visibles simultanément | ≤ 400 000 |
| Draw calls | ≤ 300 |
| Matériaux différents dans la scène | ≤ 40 |
| Lumières dynamiques | 1 directionnelle + éclairage d'ambiance ; pas de lumière dynamique par PNJ |
| Ombres | Une seule source, résolution et distance limitées |
| Distance d'affichage | Réglable (basse / moyenne) |

## 14.2. Assets

| Type | Triangles (LOD0) |
|---|---:|
| Module de bâtiment | 1 500 à 5 000 |
| Accessoire de rue | 100 à 800 |
| Arbre | 800 à 2 500 |
| Personnage (joueur, PNJ, garde) | 6 000 à 12 000 |
| Pistolet | 1 000 à 3 000 |

LOD obligatoires pour les bâtiments, arbres et personnages. Les éléments répétés sont **instanciés**.

## 14.3. Textures et formats

| Élément | Règle |
|---|---|
| Format modèles | glTF / GLB, compression maillage (Meshopt ou Draco) |
| Format textures | KTX2 (compression GPU) |
| Taille max par texture | 2048 × 2048 (1024 pour les accessoires) |
| Atlas | Façades, accessoires et sols partagés |
| Poids de départ | Contenu nécessaire au spawn : **de l'ordre de 15 à 30 Mo**, le reste chargé en arrière-plan |

## 14.4. Mesures obligatoires à chaque jalon

- FPS moyen, FPS minimal (1 % bas) sur la machine de référence.
- Temps de chargement à froid et à chaud.
- Mémoire GPU et mémoire JavaScript.
- Triangles, draw calls, matériaux, textures chargées.

---

# 15. Chargement et streaming

## 15.1. Stratégie

1. **Chargement prioritaire** : secteur du point d'apparition + secteurs adjacents (sol, collisions, bâtiments proches, personnage, interface).
2. **Chargement en arrière-plan** : secteurs restants, par ordre de proximité probable (garage et dépôt pour la mission 01).
3. **Chargement différé** : intérieurs (garage, dépôt, commerces) au moment de l'approche.
4. **Déchargement** : ressources hors de portée libérées, avec une marge pour éviter les va-et-vient.

## 15.2. Données de chargement

- Les **collisions** de toute la carte sont chargées **dès le départ** (elles sont légères et nécessaires à la validation) ; seuls les visuels sont chargés par secteur.
- Les fichiers de configuration sont chargés avant l'entrée en session.
- Une version de la carte est incluse dans la **version de protocole** : un client et un serveur avec des versions de carte différentes ne peuvent pas jouer ensemble.

---

# 16. Éclairage et ambiance

- **Un seul moment de la journée** pour le MVP (lumière tropicale de milieu de matinée ou d'après-midi, à choisir).
- Éclairage de base : une lumière directionnelle chaude, un éclairage d'ambiance, un ciel.
- **Éclairage précalculé** (textures de lumière) pour les bâtiments statiques si les tests de performance le justifient.
- Variations d'ambiance par zone obtenues par la **couleur des matériaux**, la densité de végétation et le son, plutôt que par des lumières dynamiques.
- Brume légère à distance pour masquer la limite d'affichage.

---

# 17. Plan de production par jalons

| Jalon | Contenu | Phase du CDC | Résultat attendu |
|---|---|---|---|
| **LD-0** | Plan 2D validé (grille, voies, lieux, repères), nommage, conventions | Avant la phase 1 | Plan figé pour le blockout |
| **LD-1** | **Blockout jouable** : volumes gris, collisions, limites, repères ; personnage jouable | Phase 1 | Traversée mesurée, accès à tous les lieux, aucun blocage |
| **LD-2** | **Placement gameplay** : PNJ, gardes, objets, zones, caisses, mission 01 et activités sur le blockout | Phase 2 | Mission 01 et activités jouables en solo |
| **LD-3** | **Passe d'art** : remplacement progressif des volumes par les assets finaux, avec mesure de performance à chaque lot | Phases 2 à 5 | Quartier reconnaissable et conforme au guide de style |
| **LD-4** | **Éclairage, optimisation, verrouillage** | Phase 5 | Budgets respectés sur la machine de référence |

## 17.1. Checklist du blockout (LD-1)

- [ ] Les limites du quartier sont **fermées** et testées.
- [ ] Les 7 lieux fonctionnels sont présents, **nommés** et **accessibles à pied**.
- [ ] Les trois ruelles `R-01` à `R-03` sont praticables.
- [ ] Les trois cours `CI-01` à `CI-03` sont accessibles.
- [ ] Le **temps de traversée** a été **chronométré** sur les parcours du tableau 5.2 et comparé aux estimations.
- [ ] Aucun joueur ne peut se **coincer** (test de balayage et test manuel).
- [ ] Les repères visuels (arbre, tour, enseigne, bannière, hangar) sont visibles depuis la place centrale.
- [ ] Les fichiers de données chargent sans erreur et passent le contrôle de 10.6.
- [ ] Les budgets de scène de 14.1 sont respectés **dès les volumes gris** (nombre d'objets, draw calls).

## 17.2. Ordre de travail recommandé pour la passe d'art

1. Lieux de la mission 01 : garage, dépôt, trajet entre les deux.
2. Place centrale et kiosque.
3. Rue commerçante.
4. Marché et cours intérieures.
5. Cour des ateliers.
6. Remplissage des îlots secondaires et des façades décoratives.
7. Végétation, mobilier, détails d'ambiance.

Cet ordre permet d'avoir **un parcours complet de qualité** tôt, plutôt qu'un quartier entier à moitié fini.

---

# 18. Critères de validation de la carte

## 18.1. Gameplay et accessibilité

- [ ] Tous les objectifs sont atteignables à pied, sans blocage.
- [ ] La mission 01 est terminable et sa durée se situe entre 5 et 8 minutes pour un joueur découvrant la carte.
- [ ] Chaque type d'activité est réalisable et dure dans sa fourchette cible.
- [ ] Les points d'apparition et de réapparition sont sûrs.
- [ ] Le joueur ne peut pas sortir de la carte.

## 18.2. Lisibilité

- [ ] Un joueur de test retrouve le **garage**, le **dépôt** et le **kiosque** sans carte, en moins de 5 minutes d'exploration.
- [ ] Les ruelles sont repérées comme **raccourcis**.
- [ ] Les PNJ interactifs sont **identifiables** à distance.

## 18.3. Multijoueur

- [ ] Huit joueurs peuvent être présents sans que les points de rencontre soient saturés.
- [ ] Les entités privées d'un joueur ne sont **jamais visibles** des autres.
- [ ] Aucune activité ne crée de **contention** entre joueurs sur un même objet.

## 18.4. Performance

- [ ] 30 FPS minimum sur la machine de référence ; 60 FPS visés sur une machine plus performante.
- [ ] Budgets de 14.1 à 14.3 respectés.
- [ ] Chargement initial conforme au poids visé, sans blocage prolongé.

## 18.5. Identité

- [ ] La relecture de style par des personnes connaissant le contexte ivoirien est faite et ses remarques sont traitées.
- [ ] Aucune marque réelle, aucun lieu identifiable reproduit.

---

# 19. Organisation et licences des assets

## 19.1. Dossiers

```text
apps/web/public/assets/world/
├── buildings/
├── props/
├── vegetation/
├── ground/
├── characters/
├── animations/
├── gameplay-objects/
├── audio/
└── interiors/
```

Source de travail (hors dépôt de production, ou dépôt séparé pour fichiers lourds) : fichiers de modélisation, textures sources, références.

## 19.2. Règles de nommage

- `categorie_nom_variante_lod` en minuscules, sans espace ni accent, par exemple `bld_shop_a_lod0`, `prop_stall_02_lod1`.
- Un identifiant d'asset **unique** et stable ; renommer un asset sans migration est interdit.

## 19.3. Registre de licences

Chaque asset non entièrement créé en interne est inscrit dans un registre :

| Champ | Contenu |
|---|---|
| Identifiant d'asset | Même identifiant que dans le dépôt |
| Source | Auteur, site ou prestataire |
| Licence | Type de licence et lien |
| Usage commercial | Oui / Non / À vérifier |
| Modifications autorisées | Oui / Non |
| Attribution requise | Oui / Non, et texte exact |
| Date d'acquisition | |

**Aucun asset sans licence documentée** ne doit entrer dans la branche principale.

---

# 20. Décisions et points à confirmer

## 20.1. Décisions à prendre

| # | Question | Proposition |
|---|---|---|
| Q1 | Qui produit les assets (interne, packs, prestataire) ? | Décider avant LD-3 ; chiffrer le kit de 13.1 |
| Q2 | Combien d'intérieurs accessibles ? | Garage + dépôt, plus 1 commerce maximum |
| Q3 | Quel type de quartier d'inspiration (dense et commerçant, plus résidentiel) ? | Dense et commerçant au centre, plus calme aux marges |
| Q4 | Qui relit le style côté contexte ivoirien ? | Une ou deux personnes identifiées avant LD-1 |
| Q5 | Moment de la journée de l'éclairage unique ? | Milieu de matinée |
| Q6 | Délai de réapparition des caisses de munitions | 5 minutes |
| Q7 | Comportement pendant le transport d'objet (sprint, arme) | À décider en prototype, avant `SRV-01` |
| Q8 | Vitesse de marche et de sprint | 3 m/s et 6 m/s à valider |
| Q9 | Machine de référence pour les budgets | À définir avant LD-1 |
| Q10 | Cour du dépôt vide vue d'un autre joueur : acceptable ? | À juger lors des premiers tests multijoueurs |

## 20.2. Risques propres à la carte

| Risque | Mesure |
|---|---|
| Carte trop grande ou trop vide pour 8 joueurs | Mesure de la traversée au blockout ; PNJ d'ambiance et activités réparties |
| Blocages de joueurs dans le décor | Collisions simples, test de balayage, point de ramenée de secours |
| Performances insuffisantes | Budgets dès le blockout, mesure à chaque jalon |
| Divergence entre collision visuelle et collision serveur | Un seul fichier de collision, un seul contrôleur |
| Surproduction d'art avant validation du gameplay | Blockout validé avant la passe d'art |
| Représentation maladroite du contexte local | Relecture par des personnes locales, jalon dédié |
| Assets sous licence incertaine | Registre de licences, refus des assets non documentés |

---

# 21. Prochaines actions

1. Valider ce plan (LD-0) : voies, lieux, positions et noms provisoires.
2. Fixer la **machine de référence** et les **vitesses** de déplacement.
3. Lancer le **blockout** (LD-1) avec les fichiers de 10.1 à 10.5 comme données initiales.
4. Chronométrer les parcours de 5.2 et ajuster les distances.
5. Désigner les relecteurs de style et choisir le mode de production des assets (Q1 et Q4).
