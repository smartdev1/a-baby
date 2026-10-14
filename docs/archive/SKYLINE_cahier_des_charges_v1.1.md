# SKYLINE — Abidjan District
## Cahier des charges fonctionnel et technique — MVP Web 3D

| | |
|---|---|
| **Version** | 1.1 (réécriture complète de la v1.0) |
| **Date** | 12 octobre 2026 |
| **Statut** | Document de cadrage consolidé |
| **Plateforme cible** | Navigateur web sur ordinateur (clavier / souris) |
| **Genre** | Action-aventure 3D en monde ouvert, TPS/FPS |
| **Univers** | Ville fictive inspirée d'Abidjan, Côte d'Ivoire |
| **Référence de gameplay** | Jeux d'action en monde ouvert de type GTA |
| **Monnaie du jeu** | Le **Djai** (fictive) |

> **Valeurs numériques.** Toutes les valeurs de ce document sont des paramètres initiaux de conception. Elles doivent être validées par des prototypes et des tests de performance avant d'être considérées comme définitives.

> **Légende des priorités.** **P0** = indispensable · **P1** = important si le temps le permet · **P2** = après le MVP. Tout critère d'acceptation lié à une fonctionnalité P1 est marqué **(si P1 livré)** : il n'est obligatoire que si cette fonctionnalité est effectivement livrée.

---

## Journal des décisions (v1.0 → v1.1)

### Décisions prises avec le porteur du projet

| # | Sujet | Décision |
|---|---|---|
| D1 | Monnaie | Monnaie fictive : le **Djai**. « FC » et « FCFA » sont supprimés du document. |
| D2 | Critères P1 | Les critères d'acceptation liés à une fonctionnalité P1 sont marqués « (si P1 livré) ». |
| D3 | Ordre des phases | On conserve l'ordre de la **matrice des fonctionnalités**. La section « Plan de développement » est alignée dessus. |
| D4 | Esquive | **Retirée** du MVP (la touche Alt est supprimée des commandes). |
| D5 | Munitions à la mort | **Remises au niveau initial** : chargeur 12, réserve 36. |
| D6 | Mission rejouée | La récompense déjà acquise est **nulle** lors d'un rejeu. |
| D7 | Récupération des activités | **5 minutes** par activité et par joueur. |
| D8 | Langue / format | Français, Markdown. |
| D9 | Niveau d'intervention | Réécriture complète, avec rédaction de l'architecture réseau (section 14). |

### Hypothèses de rédaction à confirmer

| # | Hypothèse | Pourquoi |
|---|---|---|
| H1 | Au rejeu de la mission 01, le **butin monétaire des gardes est désactivé**. | Éviter de transformer la mission en source de gains répétables. |
| H2 | Le **PvP (joueur contre joueur) est désactivé** dans le MVP : les joueurs ne se blessent pas. | La v1.0 ne le définit pas ; les missions et ennemis étant individuels, il n'est pas nécessaire. |
| H3 | Les **gardes de mission sont des entités privées** simulées par le serveur pour chaque joueur et visibles uniquement par lui. | Conséquence directe de l'isolation des objectifs (section 8.4). |
| H4 | « Remise au niveau initial » s'applique à la réserve **et** au chargeur, que le joueur en ait plus ou moins au moment de la mort. | Règle simple, sans exploitation possible. |
| H5 | L'unité d'affichage est « Djai » (invariable au pluriel : « 500 Djai »). | Cohérence rédactionnelle. |
| H6 | La santé est notée **PV** (points de vie) partout. | Harmonisation HP / PV. |

### Incohérences de la v1.0 corrigées

- Monnaie FC / FCFA → **Djai**.
- HP / PV → **PV**.
- Phases du texte différentes de celles de la matrice → alignées sur la matrice.
- Fonctionnalités P1 exigées sans condition dans les critères d'acceptation → marquées « si P1 livré ».
- Esquive présente dans les commandes mais absente de la matrice → retirée.
- Réapparition, munitions après la mort, rejeu de mission, délai de récupération : points ouverts → tranchés.

---

# 1. Présentation du projet

## 1.1. Vision

SKYLINE — Abidjan District est un jeu d'action 3D accessible directement depuis un navigateur web. Le joueur évolue dans un quartier urbain fictif inspiré d'Abidjan : il explore librement les rues, interagit avec les habitants, accomplit des missions, combat des ennemis et gagne des Djai.

L'objectif est de proposer une expérience inspirée des jeux GTA : liberté de déplacement, missions, combats, activités secondaires, progression individuelle et monde partagé avec d'autres joueurs.

Le jeu n'est pas une succession de niveaux fermés. Même dans le MVP, le joueur choisit son activité et peut explorer sans suivre immédiatement la mission principale.

## 1.2. Objectifs du MVP

- Un quartier urbain compact et explorable.
- Des déplacements fluides à pied.
- Une caméra à la troisième personne (TPS) et à la première personne (FPS).
- Un système de combat avec une arme à feu.
- Une mission principale complète.
- Trois catégories d'activités secondaires.
- Des PNJ aux comportements simples.
- Une économie virtuelle avec plusieurs sources de revenus.
- Un inventaire simple et un achat de munitions.
- Des sessions multijoueurs publiques.
- Un compte invité convertible en compte permanent.
- Une sauvegarde persistante des données importantes.
- Une architecture serveur sécurisée et adaptée au web.

## 1.3. Éléments exclus du MVP (P2)

- Véhicules conduisibles.
- Ville de grande superficie.
- Police et système de recherche du joueur.
- Poursuites automobiles.
- Simulation complète de la vie des PNJ.
- Dialogues générés par IA.
- Système avancé d'armes et d'équipements.
- Logements achetables.
- Personnalisation approfondie des personnages.
- Commerce complexe entre joueurs.
- Monde global persistant partagé par toutes les sessions.
- Version mobile native.
- Combat joueur contre joueur (hypothèse H2).
- Esquive (décision D4).

---

# 2. Expérience de jeu

## 2.1. Principes de conception

- **Liberté** : explorer, faire des missions, des activités secondaires, ou simplement se déplacer.
- **Identité locale** : bâtiments, commerces, ateliers, rues et ambiances s'inspirent de l'environnement urbain ivoirien, sans caricature ni reproduction littérale d'un quartier réel.
- **Accessibilité** : commandes faciles à apprendre sans sacrifier la précision du combat.
- **Progression persistante** : argent, munitions, missions et activités terminées sont conservés.
- **Multijoueur contrôlé** : plusieurs joueurs partagent une session ; missions et récompenses restent individuelles.

## 2.2. Boucle de jeu principale

1. Le joueur démarre le jeu.
2. Il choisit de jouer en invité ou de se connecter.
3. Le matchmaking le place dans une session publique.
4. Il apparaît à un point sûr.
5. Il explore et rencontre des PNJ.
6. Il accepte une mission ou une activité secondaire.
7. Il accomplit les objectifs.
8. Le serveur valide le résultat.
9. Le joueur reçoit sa récompense en Djai.
10. Il peut acheter des munitions ou poursuivre son exploration.
11. Il quitte la session et retrouve plus tard sa progression.

---

# 3. Plateforme et environnement technique

## 3.1. Plateforme cible

- Navigateurs modernes sur ordinateur, clavier et souris.
- Support prioritaire : versions récentes de Chrome, Edge et Firefox, sous réserve de tests de compatibilité.
- Mobile, tactile et applications natives hors périmètre.

## 3.2. Stack technologique proposée

| Couche | Technologie | Responsabilité |
|---|---|---|
| Moteur 3D | Babylon.js | Rendu, caméra, matériaux, éclairage, scène |
| Langage | TypeScript | Client et serveur typés |
| Build | Vite | Développement et compilation du client |
| Réseau temps réel | Colyseus | Sessions (rooms) et synchronisation |
| Runtime serveur | Node.js | Exécution du backend |
| API backend | Node.js + TypeScript | Authentification, économie, progression |
| Base de données | PostgreSQL | Persistance |
| ORM | Prisma | Accès aux données et migrations |
| Versionnement | Git | Historique et collaboration |
| Tests unitaires | Vitest | Logique applicative |
| Validation des données | Bibliothèque de schémas à choisir (ex. Zod, Valibot) | Contrôle des entrées client |
| Observabilité | Logs structurés et métriques | Diagnostic, sécurité, performances |

Cette stack est une proposition de référence. La compatibilité exacte des versions (notamment Colyseus, Babylon.js et Prisma) doit être vérifiée avant l'initialisation du projet.

## 3.3. Architecture générale

```text
SKYLINE
│
├── Client web
│   ├── Babylon.js (rendu)
│   ├── Caméra TPS/FPS
│   ├── Contrôleur du personnage (code partagé avec le serveur)
│   ├── Interface utilisateur
│   ├── Carte et marqueurs
│   ├── Inventaire et portefeuille
│   └── Client réseau (Colyseus + HTTP)
│
├── Backend Node.js (monolithe modulaire)
│   ├── Authentification
│   ├── Profils invités et permanents
│   ├── Matchmaking
│   ├── Missions et activités
│   ├── Combat et santé
│   ├── Économie
│   └── Persistance
│
├── Serveur de sessions Colyseus
│   ├── Rooms « District » (une par session)
│   ├── Simulation autoritaire
│   ├── Validation des actions
│   └── Gestion des déconnexions
│
└── PostgreSQL
    ├── Comptes et profils
    ├── Personnages
    ├── Portefeuilles et transactions
    ├── Inventaires
    ├── Missions et activités
    └── Statistiques
```

L'architecture backend est un **monolithe modulaire** : les responsabilités sont séparées dans le code, sans microservices prématurés. Le serveur Colyseus et l'API peuvent tourner dans le même processus au départ.

## 3.4. Organisation du dépôt

```text
skyline/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── game/  camera/  player/  combat/
│   │   │   ├── missions/  activities/  world/
│   │   │   └── ui/  network/
│   │   └── public/
│   └── server/
│       ├── src/
│       │   ├── auth/  matchmaking/  sessions/  combat/
│       │   ├── missions/  activities/  economy/  persistence/
│       └── tests/
├── packages/
│   ├── shared/        (contrôleur de mouvement, constantes, types)
│   ├── game-config/   (valeurs d'équilibrage, définitions d'activités)
│   └── protocol/      (schémas et versions des messages réseau)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
├── tests/
└── README.md
```

---

# 4. Monde ouvert

## 4.1. Taille de la zone jouable

Le MVP retient un petit quartier compact.

| Paramètre | Cible initiale |
|---|---|
| Largeur × longueur | 300 m × 300 m |
| Surface | Environ 90 000 m² (9 hectares) |
| Traversée à pied | Environ 2 à 4 minutes |
| Joueurs visés par session | 8 |
| Capacité de test | 12 |

La surface comprend rues, bâtiments, cours et passages. Le temps de traversée dépend de la vitesse de déplacement (à fixer), des obstacles et des itinéraires.

## 4.2. Structure urbaine

Le quartier comporte plusieurs rues connectées, des intersections, des ruelles et raccourcis piétons, des commerces, des ateliers, des cours intérieures, des espaces de rencontre, des bâtiments accessibles et des façades décoratives, des zones sûres et une zone de combat dédiée à la mission principale.

Ce n'est pas une arène rectangulaire : il doit donner l'impression d'un morceau de ville cohérent.

## 4.3. Lieux fonctionnels

1. **Garage de Kader** : départ et fin de la mission 01, rencontre avec Kader, zone sûre.
2. **Dépôt de pièces** : zone de combat de la mission 01, deux gardes hostiles, sac de pièces, accessible à pied.
3. **Marché de quartier** : commerçants et habitants, découverte d'activités, point de repère.
4. **Rue commerçante** : itinéraires de livraison, PNJ proposant des services.
5. **Cour des ateliers** : recherche d'objets, services de quartier, objets interactifs prédéfinis.
6. **Point de vente de munitions** : PNJ vendeur, interface d'achat, vérification du solde et de la capacité.
7. **Place centrale** : repère visuel, point de rencontre.

## 4.4. Contraintes de niveau

- Tous les objectifs sont accessibles à pied.
- Les raccourcis sont lisibles.
- Les limites de la carte empêchent les sorties accidentelles.
- Les bâtiments accessibles sont limités pour contrôler la complexité.
- Les zones de combat évitent les blocages involontaires.
- Les points de réapparition sont sûrs.
- Les éléments répétés sont réutilisés (instancing).
- **La géométrie de collision est simplifiée et exportée dans un format utilisable par le serveur** (voir 14.9).

---

# 5. Direction artistique et ambiance

## 5.1. Style graphique

Style semi-réaliste optimisé pour le navigateur : lumière tropicale crédible, bâtiments bas et moyens, commerces et ateliers, routes et trottoirs variés, végétation adaptée, enseignes et mobilier urbain, cours intérieures, personnages cohérents avec le cadre local.

La priorité est la lisibilité et la fluidité, pas le photoréalisme.

## 5.2. Ambiance sonore

Ambiance urbaine en boucle, bruits de pas, sons d'interaction, de tir, de rechargement, de validation d'objectif, signaux de réussite ou d'échec, réactions sonores simples des ennemis. Dialogues doublés et musique adaptative non obligatoires.

---

# 6. Contrôles du joueur

## 6.1. Commandes

| Action | Commande |
|---|---|
| Déplacement | ZQSD / WASD |
| Sprint | Maj gauche |
| Saut | Espace |
| Accroupissement | Ctrl |
| Changement TPS/FPS | V |
| Visée | Clic droit |
| Tir | Clic gauche |
| Rechargement | R |
| Interaction | E |
| Pause | Échap |

Les commandes sont testées avec les dispositions AZERTY et QWERTY. Le Ctrl peut entrer en conflit avec des raccourcis du navigateur (ex. Ctrl+W) : la possibilité de remapper les touches est à prévoir, et l'usage de l'API Pointer Lock et de la capture clavier est à valider en prototype.

## 6.2. Déplacements

Marcher, courir, sauter, s'accroupir, se déplacer en visant, interagir avec PNJ et objets. L'esquive, le parkour, l'escalade libre et les acrobaties sont exclus du MVP.

## 6.3. Caméras TPS et FPS

- TPS par défaut pour explorer.
- FPS pour viser avec plus de précision.
- Bascule avec `V`.
- La caméra ne traverse pas les murs.
- La direction de visée reste cohérente lors du changement de perspective.

---

# 7. Personnage, santé et combat

## 7.1. Équipement et paramètres initiaux

Le joueur commence avec un pistolet compact.

| Paramètre | Valeur provisoire |
|---|---:|
| Chargeur | 12 cartouches |
| Réserve initiale | 36 cartouches |
| Réserve maximale | 60 cartouches |
| Santé maximale du joueur | 100 PV |
| Santé maximale d'un garde | 100 PV |
| Dégâts par balle | 25 PV |
| Tirs pour neutraliser un garde | 4 tirs réussis |

Pas de multiplicateur de tir à la tête ni d'armure au MVP.

## 7.2. Fonctionnement du combat

Visée, tir, consommation de munitions, rechargement, vérification de la ligne de vue, dégâts, santé, neutralisation des ennemis, mort et réapparition.

## 7.3. Autorité serveur

Le client ne décide jamais seul : du nombre de cartouches, de la cadence de tir, des dégâts, de la portée, de la position définitive, de la mort d'un adversaire, de l'attribution d'un butin. Le serveur valide.

## 7.4. IA des gardes

1. Patrouiller ou surveiller une zone.
2. Détecter le joueur à proximité.
3. Passer en mode hostile.
4. Attaquer avec une cadence limitée.
5. Se déplacer vers une couverture simple si cette fonctionnalité est stable.
6. Être neutralisé lorsque sa santé atteint zéro.

Renforts, poursuites, police et comportements tactiques avancés sont hors périmètre. Les gardes de mission sont des **entités privées par joueur** (H3).

## 7.5. Mort et réapparition

- Réapparition dans une zone sûre, jamais au milieu d'un combat dangereux.
- **Munitions remises au niveau initial à la réapparition : chargeur 12, réserve 36** (D5, H4).
- La mort ne duplique ni objets ni récompenses.
- La progression persistante (Djai, missions, activités, réputation) n'est jamais effacée.
- Les Djai ne sont pas perdus à la mort.
- Si la mort survient pendant la mission 01, la mission est **réinitialisée à l'étape précédant l'entrée dans le dépôt** : les gardes sont recréés, le sac est replacé.

---

# 8. Mission principale

## 8.1. Mission 01 : « Une livraison qui tourne mal »

| | |
|---|---|
| Type | Mission mixte d'action |
| Durée cible | 5 à 8 minutes |
| Difficulté | Débutant |
| Récompense (première réussite) | **500 Djai** et **100 points de réputation** |

## 8.2. Personnages

- **Kader** : mécanicien du quartier, donneur de mission, non hostile.
- **Garde 1 et Garde 2** : ennemis du dépôt de pièces.

## 8.3. Déroulement

1. Le joueur rejoint le garage.
2. Il parle à Kader.
3. Kader lui demande de récupérer un sac de pièces détachées dans un dépôt proche.
4. Un marqueur d'objectif apparaît.
5. Le joueur se rend au dépôt.
6. L'entrée dans la zone déclenche l'hostilité des deux gardes.
7. Il les neutralise.
8. Il récupère le sac.
9. Il retourne auprès de Kader.
10. Le serveur valide la réussite.
11. Le serveur attribue la récompense **une seule fois**.
12. Le joueur invité reçoit une invitation non bloquante à créer un compte permanent.

## 8.4. Isolation des objectifs

La mission est individuelle même en présence d'autres joueurs. Chaque joueur dispose de son état de mission, de ses ennemis et de son sac. Un autre joueur ne peut ni voler le sac, ni terminer la mission, ni obtenir la récompense.

## 8.5. Rejeu de la mission

- La mission peut être rejouée après sa première réussite.
- **La récompense déjà acquise est nulle au rejeu** : 0 Djai, 0 point de réputation (D6).
- Le butin monétaire des gardes est désactivé au rejeu (H1).
- Le rejeu n'affecte pas l'état « terminée » ni l'unicité de la première récompense.
- Les récompenses des missions ultérieures (400 à 800 Djai) suivent la même règle.

## 8.6. Critères de validation

- La mission peut être acceptée et l'objectif est affiché.
- Les gardes deviennent hostiles dans les conditions prévues.
- Les tirs sont validés par le serveur.
- Le sac n'est récupérable qu'une fois les conditions remplies.
- Le retour chez Kader termine la mission.
- La récompense est attribuée une seule fois ; un rejeu rapporte 0 Djai.
- La progression est persistante.
- La mission d'un joueur ne peut pas être terminée par un autre.
- L'invitation de création de compte apparaît après la réussite.

---

# 9. Activités secondaires

Trois catégories sont prévues. Les récompenses sont en Djai.

## 9.1. Petites livraisons — 100 Djai

**Durée cible :** 1 à 3 minutes.

1. Le joueur rencontre un commerçant qui propose de transporter un colis.
2. Il accepte.
3. Le colis devient récupérable pour cette activité.
4. Il le récupère ; un marqueur indique le destinataire.
5. Il remet le colis.
6. Le serveur valide la livraison et crédite la récompense.

Règles : une seule livraison active à la fois ; récupération avant remise ; destination vérifiée côté serveur ; pas de récompense pour une livraison incomplète ; une occurrence n'est jamais payée deux fois ; aucun véhicule.

## 9.2. Recherche d'objets — 75 Djai

**Durée cible :** 1 à 4 minutes.

1. Un habitant demande de retrouver un objet perdu.
2. Une zone de recherche est indiquée.
3. Le joueur explore la zone et découvre l'objet (indice visuel ou interaction).
4. Il le récupère et le rapporte au demandeur.
5. Le serveur valide.

Règles : objets à emplacements prédéfinis ; objectifs individuels ; entrer dans la zone ne suffit pas ; récupération et remise obligatoires ; pas de génération procédurale.

## 9.3. Services de quartier — 150 Djai

**Durée cible :** 2 à 4 minutes.

1. Un commerçant demande de l'aide pour déplacer du matériel.
2. Le joueur accepte et rejoint le point de récupération.
3. Il récupère l'objet et le transporte au point de dépôt.
4. Le commerçant confirme.
5. Le serveur attribue la récompense.

Règles : ordre des étapes contrôlé ; objets et points de dépôt prédéfinis ; une récompense par occurrence ; physique avancée inutile.

## 9.4. Règles communes

| Élément | Règle |
|---|---|
| Départ | Acceptation explicite par interaction |
| Progression | Validée par le serveur |
| Carte | Marqueurs après découverte ou acceptation (marqueurs de carte : P1) |
| Récompense | Après réussite complète |
| Multijoueur | Objectifs et gains individuels |
| Reconnexion | Reprise selon l'état persisté |
| Abandon | Aucun gain |
| Répétition | Nouvelle occurrence après un délai de récupération |
| **Délai de récupération** | **5 minutes par activité et par joueur** (D7) |

---

# 10. Découverte des activités

## 10.1. Système mixte

- **Activités connues** : elles apparaissent sur la carte lorsqu'elles sont disponibles *(affichage sur la carte : P1, MVP-19)*.
- **Découverte par exploration** : le joueur rencontre des PNJ qui proposent des opportunités non affichées *(P0)*.

Sans carte (P1 non livré), les activités restent accessibles par l'exploration et l'interaction avec les PNJ.

## 10.2. Interaction avec les PNJ

1. Indication `E — Parler` à l'approche d'un PNJ interactif.
2. Le joueur interagit.
3. Le PNJ présente une demande prédéfinie.
4. Le joueur accepte ou refuse.
5. S'il accepte, l'activité est enregistrée et son objectif affiché.

Dialogues écrits à l'avance ; aucune IA conversationnelle.

## 10.3. États des activités

| État | Comportement |
|---|---|
| Non découverte | Pas de marqueur permanent |
| Découverte | Activité mémorisée |
| Disponible | Réalisable |
| En cours | Objectif affiché |
| Terminée | Résultat et récompense enregistrés |
| En récupération | Indisponible pendant 5 minutes |

## 10.4. Icônes (P1, avec la carte)

Colis : livraison · Loupe : recherche d'objets · Poignée de main : service de quartier.

Les marqueurs restent discrets, le joueur peut masquer les activités secondaires, les objectifs actifs sont prioritaires.

## 10.5. Découverte en multijoueur

- La découverte est propre à chaque joueur.
- Un joueur ne débloque pas une activité pour les autres.
- Les PNJ peuvent être vus par plusieurs joueurs.
- États et récompenses restent individuels.
- Le serveur valide chaque découverte.

## 10.6. Structure de données d'une activité

`activity_id`, `type`, `start_location`, `discovery_mode`, `reward_arender`, `cooldown_seconds` (300 par défaut), `steps`, `is_repeatable`.

La définition globale est séparée de l'état individuel du joueur.

---

# 11. Économie virtuelle

## 11.1. Monnaie : le Djai

Le **Djai** est la monnaie fictive du jeu. Elle n'a aucune valeur monétaire réelle et ne peut pas être convertie en argent réel dans le MVP.

## 11.2. Sources de revenus

| Source | Montant initial | Fréquence |
|---|---:|---|
| Première réussite de la mission 01 | 500 Djai | Une seule fois |
| Rejeu d'une mission déjà réussie | 0 Djai | — |
| Missions principales ultérieures (première réussite) | 400 à 800 Djai | Selon mission |
| Petite livraison | 100 Djai | Par occurrence valide |
| Recherche d'objets | 75 Djai | Par occurrence valide |
| Service de quartier | 150 Djai | Par occurrence valide |
| Butin monétaire de combat | 20 à 60 Djai | Si attribué |

## 11.3. Butin de combat

- Probabilité de butin monétaire : 25 % par adversaire éligible.
- Montant : entre 20 et 60 Djai.
- Butin non garanti.
- Une seule attribution par adversaire et par occurrence de combat.
- Calcul par le serveur.
- Les munitions récupérables sont distinctes du butin monétaire.
- Pas de butin sur les gardes lors d'un rejeu de mission (H1).

Le serveur empêche la création artificielle d'ennemis, la répétition des récompenses et la collecte multiple d'un même butin.

## 11.4. Protections contre les abus économiques

- Une mission terminée ne redonne jamais sa récompense initiale.
- Les gains sont calculés par le serveur.
- Les activités répétables ont un délai de récupération.
- Une mission échouée ne donne pas sa récompense finale.
- Chaque transaction a un identifiant unique.
- Une déconnexion ne réinitialise pas les récompenses.
- Montants et soldes négatifs interdits.
- Chaque crédit et débit est historisé.
- Achats et récompenses sont atomiques et idempotents.

## 11.5. Exemple d'équilibrage

```text
Mission 01 : 500
Deux livraisons : 500 + 100 + 100 = 700 Djai
Deux lots de munitions (100 chacun) : 700 − 200 = 500 Djai
```

Cet exemple sert de référence initiale pour équilibrer revenus et dépenses.

---

# 12. Inventaire et munitions

## 12.1. Contenu de l'inventaire

Uniquement : le pistolet équipé, les munitions du chargeur, les munitions de réserve. Armures, armes multiples, accessoires, artisanat et poids sont exclus.

## 12.2. Caisses de munitions

- Emplacements prédéfinis, caisse personnelle par joueur.
- Interaction avec `E`, quantité proposée : 12 cartouches.
- Vérifications serveur : proximité, disponibilité de la caisse, capacité de réserve.

## 12.3. Achat de munitions

| Paramètre | Valeur initiale |
|---|---:|
| Quantité par lot | 12 cartouches |
| Prix par lot | 100 Djai |
| Réserve maximale | 60 cartouches |
| Réserve initiale (et après mort) | 36 cartouches |

L'achat est refusé si le solde est insuffisant ou si la réserve maximale serait dépassée.

## 12.4. Atomicité des achats

Débit du portefeuille et crédit des munitions se font dans **une seule transaction**. Le serveur vérifie solde, capacité, proximité du vendeur, identifiant de requête et absence de double traitement. En cas d'échec, rien n'est appliqué.

---

# 13. Comptes invités et comptes permanents

## 13.1. Parcours utilisateur

1. Écran d'accueil.
2. Choix invité ou connexion.
3. Création ou chargement du profil.
4. Matchmaking automatique.
5. Entrée dans la session, apparition à un point sûr.
6. Exploration et progression.
7. Invitation à créer un compte après la première mission terminée.

## 13.2. Profil invité

- Démarrage sans adresse e-mail.
- Le serveur crée un identifiant de profil et un **secret d'accès imprévisible**. La progression est enregistrée côté serveur.
- Le secret n'apparaît jamais dans les journaux ni en public.
- La perte du secret ou des données locales peut rendre la récupération impossible : l'interface l'explique et propose la création d'un compte permanent.

## 13.3. Conversion vers un compte permanent

- Le serveur enregistre d'abord la mission et sa récompense.
- Une invitation non bloquante est affichée, le joueur peut refuser, l'invitation ne devient pas insistante.
- À l'inscription, le profil invité est associé au compte ; progression, portefeuille et inventaire sont conservés.
- En cas d'échec réseau, le profil invité reste utilisable.
- Un compte existant n'est jamais écrasé silencieusement.
- La fusion automatique de plusieurs profils est hors périmètre.

---

# 14. Architecture réseau

Cette section définit l'architecture réseau de référence du MVP. Les valeurs chiffrées sont des points de départ à mesurer.

## 14.1. Principes directeurs

1. **Serveur autoritaire** : le client envoie des intentions, jamais des états finaux.
2. **Simulation partagée** : le même code de mouvement tourne sur le client (prédiction) et le serveur (autorité).
3. **Séparation temporaire / persistant** : l'état de session vit en mémoire dans la room ; tout ce qui compte est écrit dans PostgreSQL via des transactions.
4. **Données privées par joueur** : les entités de mission d'un joueur ne sont pas envoyées aux autres.
5. **Mesurer avant d'optimiser** : toute cible est validée par des tests réseau.

## 14.2. Vue d'ensemble

```text
 Navigateur (client)
   │
   ├── HTTPS ──► API Node.js ──► Prisma ──► PostgreSQL
   │              • /auth (invité, connexion, conversion)
   │              • /matchmaking/join (version, profil → réservation de place)
   │              • /profile (lecture)
   │
   └── WSS ────► Serveur Colyseus
                  └── Room « District » (1 instance = 1 session, 8 joueurs)
                        • boucle de simulation autoritaire
                        • état partagé + vues privées par joueur
                        • appels internes aux modules Économie / Missions /
                          Persistance (même processus, transactions PostgreSQL)
```

| Canal | Usage |
|---|---|
| HTTPS (requête / réponse) | Authentification, profil, demande de matchmaking, conversion de compte |
| WSS (Colyseus) | Entrées, état de jeu, événements, actions de gameplay (tir, interaction, achat) |

En production, TLS est obligatoire (HTTPS / WSS).

## 14.3. Connexion et entrée en session

1. Le client obtient un **jeton d'authentification** (profil invité ou compte) via l'API.
2. Il appelle `/matchmaking/join` avec le jeton et sa **version de client / protocole**.
3. Le serveur vérifie profil, version et quotas ; il choisit une room compatible (place libre) ou en crée une, puis renvoie une **réservation de place**.
4. Le client ouvre la connexion WSS avec cette réservation.
5. À l'entrée (`onAuth` / `onJoin`), la room revalide le jeton, **charge le personnage depuis PostgreSQL** (Djai, inventaire, progression), et refuse toute seconde connexion du même personnage (l'ancienne est fermée).
6. Le joueur apparaît à un point sûr ; le serveur envoie l'instantané initial (état partagé + vue privée).

Les échecs possibles sont explicitement gérés : version incompatible, session pleine, serveur indisponible, jeton expiré, quota dépassé.

## 14.4. Sessions (rooms)

| Paramètre | Valeur initiale |
|---|---|
| Type | Public, une room « District » par session |
| Capacité nominale | 8 joueurs |
| Capacité de test | 12 joueurs (non garantie) |
| Création de rooms | Limitée par utilisateur, par IP et globalement |
| Session vide | Détruite après un délai de grâce (à fixer, ex. 60 s) |
| Place réservée | Expire si non utilisée (ex. 15 s) |

**Cycle de vie :** création → chargement de la carte de collision et des définitions → accueil des joueurs → simulation → dernier joueur parti → délai de grâce → destruction. À la destruction, aucune donnée persistante ne doit dépendre de la mémoire de la room.

## 14.5. Modèle d'état

### État partagé (visible par tous les joueurs de la room)

| Donnée | Détail |
|---|---|
| Identité | Identifiant de session du joueur, nom affiché |
| Transform | Position (x, y, z) quantifiée, orientation (yaw) |
| Pose | Énumération : à l'arrêt, marche, course, saut, accroupi, visée |
| Santé | PV (pour l'affichage) |
| Statut | Connecté, déconnecté, mort |
| Événements visuels | Tir (pour les effets sonores et visuels) |

### Vue privée (visible uniquement par le joueur concerné)

| Donnée | Détail |
|---|---|
| Mission et activités | État, étape, objectif courant |
| Entités de mission | Gardes, sac, colis, objets recherchés |
| Munitions | Chargeur et réserve |
| Portefeuille | Solde en Djai (copie d'affichage ; la vérité est en base) |
| Caisses de munitions | Disponibilité personnelle |

Implémentation : mécanisme de visibilité par client de Colyseus (vues filtrées de l'état) ou, à défaut, messages ciblés. **À valider en prototype selon la version de Colyseus retenue.**

Conséquence (H3) : un garde appartient à un joueur. Le serveur simule les gardes de chaque joueur et ne résout les tirs d'un joueur que contre ses propres entités. Coût de simulation maximal : 2 gardes × 8 joueurs = 16 gardes simultanés pour la mission 01, ce qui reste modeste.

## 14.6. Protocole de messages

Les schémas sont définis dans `packages/protocol`, versionnés, et **validés côté serveur pour chaque message reçu**.

### Client → serveur

| Message | Contenu principal | Fiabilité / règle |
|---|---|---|
| `input` | N° de séquence, axes de déplacement, yaw / pitch, drapeaux (sprint, saut, accroupi), durée de l'intervalle | Haute fréquence ; limité en taux |
| `fire` | N° de séquence, direction de visée, temps client estimé | Le serveur recalcule origine, cadence et résultat |
| `reload` | N° de séquence | Validé par le serveur |
| `interact` | Identifiant de cible | Proximité et état vérifiés |
| `mission_action` / `activity_action` | Identifiant, action (accepter, refuser, abandonner) | Transitions d'état contrôlées |
| `purchase` | **Clé d'idempotence**, identifiant d'article, quantité | Idempotent |
| `ping` | Horodatage client | Mesure de RTT |

### Serveur → client

| Message | Contenu |
|---|---|
| Correctifs d'état (delta) | Changements de l'état partagé et de la vue privée |
| `input_ack` | Dernier numéro d'entrée traité, position autoritaire |
| `hit` / `death` / `respawn` | Événements de combat |
| `objective_update` | Progression de mission ou d'activité |
| `reward` | Récompense confirmée (montant, identifiant de transaction) |
| `purchase_result` | Succès ou échec explicite, avec solde et munitions mis à jour |
| `error` | Code d'erreur normalisé |
| `pong` | Écho d'horodatage |

Règles : taille maximale par message, rejet des messages invalides ou inconnus, compteur de violations par joueur, version de protocole vérifiée à l'entrée.

## 14.7. Boucle de simulation serveur

| Paramètre | Valeur initiale |
|---|---|
| Fréquence de simulation | 20 à 30 ticks/s (départ conseillé : 20, à monter si le CPU le permet) |
| Fréquence d'envoi des états | Environ 15 à 20 Hz |

Ordre d'un tick :

1. Lire les entrées en file, par joueur, dans l'ordre des numéros de séquence.
2. Appliquer le mouvement avec le contrôleur partagé et valider (vitesse maximale, collisions).
3. Traiter les tirs, rechargements et interactions.
4. Mettre à jour l'IA des gardes et les déclencheurs de mission.
5. Résoudre dégâts, morts, objectifs et butins ; déclencher les opérations économiques via le module Économie.
6. Enregistrer l'historique de positions (pour la compensation de latence).
7. Produire et envoyer les correctifs d'état.

Le temps de tick est mesuré en continu ; un dépassement répété du budget déclenche une alerte.

## 14.8. Prédiction, réconciliation et interpolation

**Joueur local (prédiction)**
- Chaque entrée est numérotée, appliquée immédiatement par le client et envoyée au serveur.
- Le serveur renvoie la position autoritaire avec le dernier numéro traité.
- Le client rejoue les entrées non confirmées sur cette position.
- Écart faible : correction lissée. Écart important ou déplacement impossible : correction immédiate. Seuils initiaux à régler (ex. lissage sous 0,1 m, correction immédiate au-delà d'environ 1 m).

**Joueurs distants (interpolation)**
- Le client affiche les autres joueurs avec un léger retard (environ 100 ms, soit 2 mises à jour à 20 Hz), en interpolant entre deux états reçus.
- Extrapolation brève et plafonnée en cas de perte de mises à jour, puis figement.

## 14.9. Contrôleur de mouvement et collisions partagés

Le serveur ne fait pas tourner Babylon.js. Pour que prédiction et autorité concordent :

- Un **contrôleur cinématique** (capsule contre géométrie statique simplifiée) est écrit en TypeScript pur dans `packages/shared`.
- La **géométrie de collision** du quartier (boîtes, murs, sols) est exportée de la scène dans un format compact lu par le client et par le serveur.
- Le pas de simulation est fixe et identique des deux côtés.
- Le déterminisme n'a pas besoin d'être parfait : la réconciliation absorbe les petites divergences.

## 14.10. Combat et compensation de latence

- Le pistolet est traité en **hitscan** : le serveur trace le rayon à partir de **sa propre position** du joueur (jamais celle déclarée par le client), dans la direction transmise.
- Vérifications : cadence, munitions, portée, ligne de vue contre la géométrie, état du tireur (vivant, non en rechargement).
- Les dégâts sont décidés par le serveur ; le client n'affiche qu'une prédiction visuelle (flash, son), corrigée par `hit` ou son absence.
- **Compensation de latence limitée (à valider en prototype)** : le serveur garde un historique court des positions de l'entité visée (environ 500 ms) et peut la « reculer » d'au plus une valeur plafonnée (ex. 150 ms) calculée à partir du RTT mesuré. Le client ne déclare jamais lui-même une touche.
- PvP désactivé par défaut (H2) : la compensation ne concerne que les gardes. Si le PvP est ajouté plus tard, la même mécanique s'applique aux joueurs.

## 14.11. Fiabilité, idempotence et opérations économiques

- Les WebSockets sont fiables et ordonnés (TCP) : pas de perte de message, mais un blocage de tête de file en cas de paquets perdus. Les entrées anciennes sont donc ignorées si elles arrivent trop tard.
- Les messages fréquents (`input`, états) sont distincts des **actions critiques** (`purchase`, remise d'objectif), qui portent une **clé d'idempotence** et reçoivent un accusé explicite.
- Toute opération économique suit le chemin : validation en room → appel au module Économie → **transaction PostgreSQL** (clé d'idempotence, contrôle de solde et limites, journal, mise à jour du portefeuille et de l'inventaire) → accusé au client.
- Le client **ne crédite jamais** localement une récompense ou un achat sans confirmation du serveur.
- Un renvoi de la même clé après reconnexion retourne le résultat initial sans le rejouer.

## 14.12. Persistance depuis la session

| Donnée | Quand elle est écrite |
|---|---|
| Récompenses, achats, butin (Djai, munitions achetées) | Immédiatement, dans une transaction |
| Progression de mission / activité | À chaque changement d'étape validé |
| Statistiques | Périodiquement et à la déconnexion |
| Position, état des gardes, animations | Jamais (état temporaire) |

À la déconnexion ou à la destruction de la room, un enregistrement final est tenté ; en cas d'échec, la dernière valeur validée en base fait foi.

## 14.13. Déconnexion et reconnexion

1. Perte détectée côté client (fermeture, silence prolongé, ping sans réponse).
2. Côté serveur, le personnage est marqué « déconnecté » : il reste dans la session pendant **30 à 60 secondes**, immobile, non attaquable et sans pouvoir effectuer d'opération.
3. Le client tente de se reconnecter avec un **jeton de reconnexion** : backoff exponentiel avec jitter (ex. base 0,5 s, plafond 10 s, nombre de tentatives limité).
4. Si la room existe encore : retour dans la session, **rechargement complet de l'état autoritaire**.
5. Si la room a disparu ou le délai est dépassé : retour au matchmaking, nouvelle session, données restaurées depuis PostgreSQL.
6. Un message clair informe le joueur à chaque étape (connexion, perte, reconnexion, session perdue, serveur indisponible, version incompatible, délai dépassé).

La **reprise de la session existante est P1 (MVP-32)** ; la **restauration des données persistantes dans une nouvelle session est P0 (MVP-27)**.

## 14.14. Protections réseau et anti-abus

- Limitation de fréquence par type de message et par joueur.
- Validation stricte des schémas, taille maximale des messages.
- Contrôle de version de protocole à l'entrée.
- Un seul personnage actif par compte.
- Limites de création de rooms et de connexions par IP / par compte.
- Vérification de l'origine des requêtes, TLS en production.
- Journal d'audit des opérations sensibles ; détection d'anomalies (vitesse, cadence de tir, précision statistique).
- Un signal isolé ne déclenche jamais de bannissement définitif.

## 14.15. Budget de bande passante (hypothèse à mesurer)

Ordre de grandeur pour 8 joueurs à 20 Hz, entité joueur quantifiée d'environ 20 à 30 octets :

- **Descendant** : 7 autres joueurs × ~25 octets × 20 Hz ≈ 3,5 Ko/s, auxquels s'ajoutent la vue privée, les événements et les en-têtes : cible **< 20 Ko/s** par joueur.
- **Montant** : ~30 entrées/s × ~20 octets ≈ 0,6 Ko/s : cible **< 5 Ko/s**.

Techniques : position et angles quantifiés, envoi des seuls changements, pas de données statiques répétées, regroupement des messages, taille maximale contrôlée. Le trafic entrant et sortant par joueur est mesuré dès le prototype.

## 14.16. Hébergement et montée en charge

- **Départ simple** : un processus Node.js hébergeant l'API et Colyseus, un PostgreSQL géré, un seul environnement de production.
- **Évolution** : plusieurs processus avec présence et matchmaking partagés (ex. Redis), répartition des rooms, connexions WebSocket stables vers un même processus.
- **Région** : une région proche de l'Afrique de l'Ouest et une région européenne seront comparées par **mesures réelles de latence** depuis les réseaux des joueurs visés (réseaux mobiles et fixes). La proximité géographique n'est pas une garantie de faible latence.
- Dimensionnement : le nombre de rooms par processus est déterminé par les tests de charge (CPU, mémoire, temps de tick).

## 14.17. Observabilité réseau

Métriques par room et globales : joueurs connectés, rooms actives, temps de tick (p50/p95/p99), RTT par joueur, jitter, perte, taux de réconciliation (corrections fortes), bande passante entrante et sortante, taille des messages, messages rejetés, taux d'erreur, reconnexions réussies et échouées, durée de transaction base de données. Logs structurés, sans secret.

## 14.18. Plan de tests réseau

| Axe | Cas à couvrir |
|---|---|
| Conditions réseau | RTT faible / moyen / élevé, jitter, perte de paquets (simulés avec un outil de dégradation réseau) |
| Connexion | Déconnexion courte et longue, reconnexion à une session existante, destruction de la room pendant la déconnexion |
| Concurrence | Tirs simultanés, achats concurrents avec la même clé et avec des clés différentes |
| Charge | 8 joueurs, tentative à 12 joueurs, création et destruction de rooms |
| Clients dégradés | Faible fréquence d'images, onglet en arrière-plan |
| Sécurité | Messages invalides, rejeu de messages, cadence de tir excessive, vitesse impossible |

Résultats attendus : percentiles p50, p95, p99, CPU, mémoire, bande passante, taux d'erreur. Les tests distinguent **temps réseau, traitement serveur, rendu client et chargement des ressources**.

## 14.19. Objectifs réseau initiaux

| Indicateur | Cible provisoire |
|---|---|
| Simulation serveur | 20 à 30 ticks/s |
| Synchronisation des entités distantes | ~15 à 20 Hz |
| RTT cible (environnement de test défini) | < 100 ms |
| Fluidité client minimale | 30 FPS |
| Fluidité souhaitée (machine performante) | 60 FPS |
| Joueurs par session | 8 (test à 12) |

Ces chiffres sont des objectifs à mesurer, pas des garanties.

## 14.20. Décisions réseau restant à valider

- Version de Colyseus et mécanisme exact de vues privées.
- Fréquence de tick définitive (20 ou 30).
- Paramètres de compensation de latence (plafond de rembobinage).
- Durée exacte de la fenêtre de reconnexion (30 à 60 s).
- Confirmation du PvP désactivé (H2).
- Fournisseur et région d'hébergement.

---

# 15. Base de données et persistance

## 15.1. Entités principales

| Entité | Rôle |
|---|---|
| `users` | Comptes permanents |
| `guest_profiles` | Profils invités |
| `auth_sessions` | Sessions d'authentification |
| `characters` | Personnages et état durable |
| `player_wallets` | Soldes en Djai |
| `wallet_transactions` | Historique financier (clé d'idempotence unique) |
| `inventory_items` | Équipement et munitions |
| `mission_progress` | Progression des missions |
| `mission_rewards` | Récompenses attribuées (unicité par personnage et mission) |
| `activity_progress` | Découvertes et progression |
| `activity_occurrences` | Occurrences répétables et délais de récupération |
| `player_statistics` | Statistiques |
| `world_events` | Extension future |

Noms indicatifs ; relations, index, contraintes et types sont définis lors de la conception du schéma.

## 15.2. Transactions financières

1. Vérification des conditions par le serveur.
2. Ouverture d'une transaction PostgreSQL.
3. Vérification de la clé d'idempotence.
4. Contrôle du solde.
5. Contrôle des limites.
6. Enregistrement du mouvement financier.
7. Mise à jour du portefeuille et, si nécessaire, de l'inventaire.
8. Validation de la transaction.

Si une étape échoue, tout est annulé. Les contraintes d'unicité en base (clé d'idempotence, récompense de mission par personnage) servent de dernier filet de sécurité.

## 15.3. Sauvegardes

- Sauvegardes automatisées, migrations versionnées.
- Procédure de restauration documentée et testée périodiquement.
- Aucune donnée persistante ne dépend uniquement de la mémoire d'une session.
- Opérations économiques auditables.

---

# 16. Sécurité et anti-triche

## 16.1. Validation des actions

Le serveur vérifie : vitesse et déplacements, fréquence de tir, consommation de munitions, dégâts, proximité des interactions, état des objectifs, validité des objets récupérés, conditions de récompense, achats, délais de récupération.

## 16.2. Prévention des abus

Limitation de fréquence, validation stricte des messages, contrôle des transitions d'état, clés d'idempotence, contraintes d'unicité, journal d'audit, détection d'anomalies, limitation de création de sessions, contrôle de version du protocole. Un seul signal faible ne déclenche pas de bannissement définitif.

## 16.3. Protection des secrets

Secrets hors du dépôt Git ; communications sécurisées ; base de données à privilèges minimaux ; aucun secret d'authentification dans les journaux ; entrées validées et limitées ; dépendances versionnées et mises à jour.

---

# 17. Performance du client web

## 17.1. Objectifs

30 FPS minimum sur la machine de référence, 60 FPS souhaités sur une configuration plus performante, chargement progressif, pas de blocage prolongé, mémoire et GPU maîtrisés.

## 17.2. Techniques d'optimisation

LOD, instancing, réduction des draw calls, compression des textures et modèles, peu de matériaux différents, lumières dynamiques limitées, ombres peu coûteuses, collisions simplifiées, chargement différé, libération des ressources inutilisées, distance d'affichage réglable, profilage avec les outils du navigateur et de Babylon.js.

## 17.3. Chargement des ressources

Priorité aux éléments nécessaires au spawn et à l'environnement proche ; chargement progressif du reste ; intérieurs non téléchargés au démarrage ; configurations graphiques basse et moyenne à prévoir.

Le profilage commence dès la phase 1 : l'optimisation finale (MVP-31) est stabilisée en phase 5, mais les budgets sont surveillés dès le prototype.

---

# 18. Interfaces utilisateur

Écran de démarrage · choix invité / connexion · écran de chargement · état du matchmaking · HUD santé, munitions et Djai · réticule · indication d'interaction · objectifs de mission · carte ou minimap *(P1)* · marqueurs d'activités *(P1)* · interface d'achat · portefeuille · notifications de récompense · écran de pause avec paramètres essentiels · écran de mort et réapparition · invitation à créer un compte · messages de déconnexion et de reconnexion.

L'interface est lisible, discrète et adaptée au clavier / à la souris.

---

# 19. Tests et qualité

## 19.1. Tests unitaires

Dégâts, consommation de munitions, rechargement, remise à niveau initial des munitions à la mort, conditions de réussite des missions, récompense nulle au rejeu, progression des activités, calcul des récompenses, délai de récupération de 5 minutes.

## 19.2. Tests d'intégration

Création de profil invité, conversion en compte permanent, fin de mission, attribution des récompenses, achat de munitions, persistance après reconnexion, transactions concurrentes, idempotence.

## 19.3. Test de bout en bout (scénario principal)

1. Démarrer en invité.
2. Rejoindre une session.
3. Accepter la mission 01.
4. Combattre les deux gardes.
5. Récupérer le sac.
6. Terminer la mission.
7. Recevoir 500 Djai.
8. Effectuer une activité secondaire.
9. Acheter des munitions.
10. Se déconnecter, puis revenir.
11. Vérifier la persistance et l'absence de doublons.
12. Rejouer la mission 01 : vérifier que la récompense est nulle.

## 19.4. Tests de charge

Huit joueurs simultanés, tentative à douze, tirs et achats concurrents, création et destruction de sessions, mesure CPU, mémoire, latence et bande passante (voir 14.18).

---

# 20. Déploiement et exploitation

- **Développement local** : client, serveur et base.
- **Staging** : environnement partagé pour fonctionnalités et réseau.
- **Production** : TLS/WSS, sauvegardes, journaux, métriques.

Exigences : variables d'environnement et secrets sécurisés, migrations contrôlées, health checks, journaux structurés et rotation, surveillance des erreurs, du CPU, de la mémoire et des sessions actives, sauvegardes et tests de restauration, versionnement client / serveur, procédure de retour arrière.

---

# 21. Matrice des fonctionnalités MVP

| ID | Module | Fonctionnalité | Priorité | Phase | Critère de validation |
|---|---|---|:-:|:-:|---|
| MVP-01 | Monde 3D | Quartier de 300 × 300 m | P0 | 1 | Exploration sans chargement bloquant majeur. |
| MVP-02 | Monde 3D | Décors inspirés d'Abidjan | P0 | 1 | Rues, commerces, ateliers et bâtiments prévus présents. |
| MVP-03 | Joueur | Déplacement ZQSD/WASD | P0 | 1 | Déplacement correct dans les quatre directions. |
| MVP-04 | Joueur | Saut, course, accroupissement | P0 | 1 | Trois actions fonctionnelles et contrôlées. |
| MVP-05 | Caméra | TPS par défaut, bascule FPS | P0 | 1 | Touche V : changement sans blocage. |
| MVP-06 | Combat | Visée et tir au pistolet | P0 | 2 | Respect des munitions, de la portée et de la ligne de vue. |
| MVP-07 | Combat | Santé et dégâts | P0 | 2 | 100 PV pour joueur et ennemis ; dégâts cohérents. |
| MVP-08 | Combat | Rechargement et réserve | P0 | 2 | Chargeur 12, réserve plafonnée à 60 ; remise à 12 / 36 à la mort. |
| MVP-09 | Ennemis | Gardes hostiles simples | P0 | 2 | Détection et attaque selon les règles définies. |
| MVP-10 | Interaction | PNJ et objets | P0 | 1 | Touche E déclenche l'interaction à proximité. |
| MVP-11 | Missions | Mission « Une livraison qui tourne mal » | P0 | 2 | Démarrer, terminer, être récompensé. |
| MVP-12 | Missions | Objectifs et progression individuels | P0 | 2 | La progression d'un joueur ne modifie pas celle des autres. |
| MVP-13 | Économie | Portefeuille en Djai | P0 | 2 | Solde conservé côté serveur et mis à jour après chaque transaction. |
| MVP-14 | Économie | Récompense de mission | P0 | 2 | 500 Djai attribués une seule fois ; rejeu = 0 Djai. |
| MVP-15 | Économie | Achat de munitions | P0 | 2 | Lot de 12 balles à 100 Djai, validé côté serveur. |
| MVP-16 | Activités | Petites livraisons | P0 | 2 | Lancée, terminée, récompensée sans doublon. |
| MVP-17 | Activités | Recherche d'objets | P0 | 2 | Objets détectables, récompense non duplicable. |
| MVP-18 | Activités | Services de quartier | P0 | 2 | Tâche simple accomplie pour un PNJ. |
| MVP-19 | Activités | Découverte par carte et exploration | P1 | 5 | Certaines activités indiquées sur la carte, d'autres découvertes en jeu. |
| MVP-20 | Multijoueur | Sessions publiques, matchmaking | P0 | 3 | Rejoindre automatiquement une session disponible. |
| MVP-21 | Multijoueur | Jusqu'à 8 joueurs par session | P0 | 3 | Huit joueurs sans anomalie bloquante. |
| MVP-22 | Multijoueur | Synchronisation des joueurs | P0 | 3 | Déplacements et actions distants visibles avec latence acceptable. |
| MVP-23 | Multijoueur | Validation serveur des tirs et dégâts | P0 | 3 | Un client ne peut imposer ni dégâts ni munitions. |
| MVP-24 | Comptes | Profil invité sans inscription | P0 | 4 | Démarrer sans e-mail. |
| MVP-25 | Comptes | Invitation après la première mission | P0 | 4 | Apparaît après sauvegarde de la progression et de la récompense. |
| MVP-26 | Comptes | Conversion en compte permanent | P0 | 4 | Progression conservée. |
| MVP-27 | Sauvegarde | Persistance de la progression | P0 | 4 | Solde, inventaire et progression restaurés après reconnexion. |
| MVP-28 | Interface | HUD santé, munitions, Djai | P0 | 1 | Affichage conforme à l'état réel. |
| MVP-29 | Interface | Carte simple et objectifs actifs | P1 | 5 | Localiser les points utiles et suivre la mission. |
| MVP-30 | Interface | Menu pause et paramètres | P0 | 5 | Pause, reprise, réglages de base. |
| MVP-31 | Technique | Chargement progressif, optimisation 3D | P0 | 5 | Objectifs de performance respectés sur la configuration de référence. |
| MVP-32 | Technique | Reconnexion après coupure temporaire | P1 | 4 | Retrouver sa session si elle existe encore et si le délai est respecté. |
| MVP-33 | Sécurité | Protection contre les récompenses dupliquées | P0 | 4 | Aucune récompense payée deux fois. |
| MVP-34 | Tests | Tests de session et de charge | P0 | 3 et 5 | Huit joueurs (phase 3) ; tentative à douze et campagne complète (phase 5). |
| MVP-35 | Extensions | Véhicules, police, monde persistant global | P2 | — | Exclus du MVP. |

*Note de phasage :* conformément à la décision D3, l'ordre suit la matrice. Les achats, récompenses et le portefeuille (phase 2) utilisent d'abord un profil de développement ; leur raccordement aux profils invités et comptes permanents est finalisé en phase 4. La même règle d'atomicité s'applique dès la phase 2.

---

# 22. Plan de développement du MVP (aligné sur la matrice)

## Phase 1 — Prototype jouable
**MVP-01 à MVP-05, MVP-10, MVP-28.**
Initialiser le dépôt, configurer Babylon.js / TypeScript / Vite, créer le quartier de base, déplacer le personnage, gérer les caméras TPS/FPS, valider les collisions et les interactions, afficher le HUD, **mesurer les performances dès maintenant**, **exporter la géométrie de collision partagée** et poser le contrôleur de mouvement dans `packages/shared`.
**Résultat :** un personnage explore une petite scène dans le navigateur.

## Phase 2 — Vertical slice solo
**MVP-06 à MVP-18.**
Combat, santé, rechargement, gardes, Kader, mission 01, portefeuille en Djai, récompenses, achat de munitions, trois activités secondaires, premières transactions atomiques.
**Résultat :** la mission principale et les activités se terminent du début à la fin.

## Phase 3 — Multijoueur sécurisé
**MVP-20 à MVP-23, MVP-34 (volet 8 joueurs).**
Colyseus, matchmaking, rooms « District », synchronisation, prédiction et interpolation, vues privées par joueur, autorité serveur sur tirs et dégâts, premiers tests réseau à 8 joueurs (section 14).
**Résultat :** plusieurs joueurs partagent une session sans partager indûment leurs objectifs.

## Phase 4 — Comptes et sauvegardes
**MVP-24 à MVP-27, MVP-32, MVP-33.**
Profils invités, conversion en compte permanent, persistance finale, protections contre les récompenses dupliquées, reconnexion de session (P1).
**Résultat :** un joueur peut quitter, revenir et retrouver sa progression sans doublon.

## Phase 5 — Stabilisation et tests
**MVP-19, MVP-29, MVP-30, MVP-31, MVP-34 (volet complet).**
Découverte par carte, carte et objectifs, menu pause, optimisation, tests à 8 et 12 joueurs, tests de charge, correction des bugs bloquants, vérification des critères d'acceptation. Les éléments P1 (MVP-19, 29, 32) peuvent être reportés s'ils menacent la livraison du parcours complet.
**Résultat :** un MVP jouable et testable par un groupe restreint.

---

# 23. Critères globaux d'acceptation

Les critères suivis de **(si P1 livré)** ne sont obligatoires que si la fonctionnalité P1 correspondante est livrée.

## Gameplay
- [ ] Le quartier est navigable.
- [ ] Les caméras TPS et FPS fonctionnent.
- [ ] Déplacements et interactions fonctionnent (sans esquive).
- [ ] Le pistolet et le rechargement fonctionnent.
- [ ] Les dégâts sont calculés par le serveur.
- [ ] Les deux gardes ont une IA élémentaire.
- [ ] La mission 01 est terminable ; un rejeu ne rapporte rien.
- [ ] Les trois catégories d'activités secondaires fonctionnent.
- [ ] La découverte par exploration (PNJ) fonctionne.
- [ ] La découverte par la carte fonctionne **(si P1 livré)**.
- [ ] La minimap et le suivi des objectifs sur carte fonctionnent **(si P1 livré)**.
- [ ] À la mort, les munitions reviennent à 12 / 36.

## Économie
- [ ] Les récompenses sont validées côté serveur.
- [ ] Le butin ne peut pas être dupliqué.
- [ ] Les achats sont atomiques.
- [ ] Les transactions sont journalisées.
- [ ] Le solde ne peut pas devenir négatif.
- [ ] Une occurrence ne peut pas être payée deux fois.
- [ ] Un délai de récupération de 5 minutes est appliqué aux activités.

## Multijoueur
- [ ] Le matchmaking public fonctionne.
- [ ] Huit joueurs peuvent être testés dans une session.
- [ ] Les déplacements sont synchronisés.
- [ ] Les objectifs de mission restent individuels et les entités de mission sont privées.
- [ ] Les déconnexions sont gérées.
- [ ] Une nouvelle connexion restaure les données persistantes.
- [ ] La reprise de la session existante après coupure fonctionne **(si P1 livré)**.

## Comptes et persistance
- [ ] Démarrage en invité sans e-mail.
- [ ] Profil invité enregistré côté serveur.
- [ ] L'invitation apparaît après la première mission.
- [ ] La conversion conserve la progression.
- [ ] Les erreurs réseau ne détruisent pas le profil invité.
- [ ] Les récompenses ne sont pas dupliquées.

## Performance et exploitation
- [ ] Les FPS client sont mesurés.
- [ ] La latence réseau est mesurée.
- [ ] Les tests à huit joueurs sont documentés.
- [ ] Les tests à douze joueurs sont tentés.
- [ ] Logs et métriques exploitables.
- [ ] Sauvegardes et restauration testées.
- [ ] Dépendances documentées.
- [ ] Aucun bug bloquant sur la boucle principale.

---

# 24. Définition de « MVP terminé »

Le MVP est livrable lorsque :

- Un nouveau joueur lance le jeu depuis un navigateur desktop.
- Il explore le quartier, combat et termine la première mission.
- Il reçoit sa récompense en Djai sans double paiement possible.
- Il achète des munitions et réalise au moins une activité secondaire de chaque type.
- Il joue avec d'autres joueurs dans une session publique de 8 personnes.
- Ses actions critiques et sa progression sont validées côté serveur.
- Il quitte, revient et retrouve les données persistantes prévues.
- Le jeu fonctionne de façon acceptable sur la configuration matérielle de référence.

---

# 25. Risques et points restant à confirmer

| Risque | Mesure proposée |
|---|---|
| Périmètre trop important | Construire d'abord une mission complète |
| Performances insuffisantes | Limiter les intérieurs, profiler dès la phase 1 |
| Latence élevée | Mesurer les réseaux des testeurs ; comparer les régions |
| Divergence prédiction client / serveur | Contrôleur et collisions partagés |
| Triche économique | Transactions atomiques, idempotence, validation serveur |
| Conflits de mission | Objectifs et entités privés par joueur |
| Perte de profil invité | Persistance serveur et avertissement clair |
| Coût d'hébergement | Limiter les sessions, mesurer leur consommation |
| Ajout excessif de fonctionnalités | Véhicules, police et grande ville restent hors MVP |
| Multijoueur, 3D ouverte et persistance | Les tester tôt, sans attendre la fin du développement |

**Points restant ouverts**
- Vitesse du personnage et paramètres précis des caméras.
- Récompenses des missions ultérieures.
- Configuration PC de référence.
- Fournisseur et région d'hébergement.
- Versions exactes des dépendances.
- Durée de vie des sessions vides.
- Paramètres de compensation de latence.
- Confirmation des hypothèses H1 à H6.
- Remappage des touches (conflits Ctrl / navigateur).

---

# 26. Glossaire

- **MVP** : première version minimale démontrant les fonctionnalités essentielles.
- **Djai** : monnaie fictive du jeu.
- **TPS / FPS** : caméra à la troisième / première personne.
- **PNJ** : personnage non joueur.
- **PV** : points de vie.
- **Tick serveur** : pas de mise à jour de la simulation serveur.
- **RTT** : temps aller-retour d'un paquet.
- **Jitter** : variation du temps de transit.
- **Interpolation** : estimation visuelle entre deux états reçus.
- **Prédiction client** : simulation locale anticipée.
- **Réconciliation** : correction de l'état local à partir de l'état serveur.
- **Compensation de latence** : prise en compte du retard réseau lors de la validation d'un tir.
- **Hitscan** : tir à impact instantané résolu par un rayon.
- **Idempotence** : répéter une requête ne répète pas son effet.
- **Autorité serveur** : le serveur décide de l'état qui fait foi.
- **Session / room** : instance temporaire du quartier accueillant plusieurs joueurs.
- **Vue privée** : partie de l'état visible par un seul joueur.

---

# Conclusion

SKYLINE — Abidjan District commence par un quartier compact, cohérent et suffisamment vivant pour offrir une vraie liberté d'action.

La priorité est de construire une boucle complète : explorer, rencontrer des PNJ, accepter une mission, combattre, récupérer un objet, recevoir une récompense en Djai et poursuivre son exploration.

La réussite du MVP dépendra moins de la taille de la carte que de la qualité des interactions, de la fluidité des déplacements, de la fiabilité du multijoueur et de la persistance des données.

La règle fondamentale de l'architecture : **le client affiche et transmet les intentions ; le serveur valide les actions importantes ; la base de données conserve la progression.**
