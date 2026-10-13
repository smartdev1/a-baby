# Architecture — SKYLINE : Yopougon, vie virtuelle

| | |
|---|---|
| **Statut** | Référence d'architecture v1, rédigée le 13/10/2026 par l'agent Architecte |
| **Remplace** | `SKYLINE_cahier_des_charges_v1.1.md` pour la vision, le périmètre et la stack (voir ADR 0001). Le CDC reste une source réutilisable pour : réseau autoritaire (§14), économie idempotente (§11.4, §12.4, §15.2), comptes invités (§13), sécurité (§16), performance client (§17) |
| **Sources** | `docs/cartographie-projet.md` (fait foi sur l'existant), décisions du propriétaire du 13/10/2026, ADR dans `docs/adr/` |
| **Roadmap** | `docs/roadmap.md` ; backlog J0 dans `docs/backlog/` |
| **Langue** | Document en français à la demande du propriétaire. Le code, les identifiants et les commits restent en anglais (CLAUDE.md) |

Conventions de lecture : **[MVP]** = livré avant la bêta fermée (jalons J0 à J7) ; **[v2]** = point d'extension prévu, à ne pas construire ; **[H]** = hypothèse explicite à confirmer.

---

## Sommaire

1. Vision & objectif
2. Périmètre (in scope / out of scope)
3. Points de désaccord (contradiction ferme)
4. Hypothèses de travail
5. Principes d'architecture
6. Architecture cible (vue d'ensemble)
7. Stack & justification
8. Arborescence cible du monorepo
9. Règles de modularité (non négociables)
10. Monde : référentiel géographique, tuiles, streaming
11. Pipeline carte OSM → tuiles
12. Rendu semi-réaliste
13. Simulation serveur MMO
14. Contrats réseau
15. Moteur d'actions piloté par les données
16. Besoins, temps de jeu, métiers, logement
17. Système de transport
18. Économie (Djai)
19. Modèle de données (haut niveau)
20. Comptes, sécurité, RGPD, loi ivoirienne 2013-450
21. Licence ODbL et données tierces
22. Observabilité
23. Tests et qualité
24. Plateforme : PC d'abord, prêt pour le mobile
25. Points d'extension v2 (combat, missions, police, Abidjan)
26. Existant → devenir (fichier par fichier)
27. Conventions de code
28. Règles non-négociables (critères de l'agent Review)
29. Journal de décisions (index des ADR)
30. Consignes pour l'agent Design
31. Consignes pour l'agent Backend
32. Consignes pour l'agent Sécurité

---

## 1. Vision & objectif

**SKYLINE** est une « vie virtuelle » en 3D dans le navigateur. Le joueur vit une vie ordinaire dans la **commune entière de Yopougon** (Abidjan), reproduite **à l'échelle réelle 1:1** à partir de données cartographiques ouvertes (OpenStreetMap). Il travaille, mange un garba, se fait tresser, prend un woro-woro, loue une chambre, va au maquis, joue au foot de quartier, prie, danse, achète une maison, ouvre son propre maquis et embauche d'autres joueurs, épargne en Djai.

- **Pour qui** : d'abord les Ivoiriens et la diaspora, qui reconnaissent leur commune ; ensuite tout joueur curieux d'une ville africaine réelle.
- **Problème résolu** : aucun jeu de simulation de vie ne met en scène une ville ouest-africaine réelle, avec ses codes (maquis, gbaka, Mobile Money, cours communes).
- **Ambition structurelle** : un **monde unique et persistant**, sans limite de joueurs imposée par l'architecture, conçu pour s'étendre aux autres communes d'Abidjan sans réécriture. Une commune supplémentaire, c'est **des données et du contenu**, pas du code.
- **Direction artistique** : **semi-réaliste** (PBR), obtenue par génération procédurale à partir de kits modulaires et complétée par des assets « héros » sur les lieux clés.
- **Monnaie** : le Djai, fictive, sans valeur réelle et non convertible.

---

## 2. Périmètre

### 2.1. In scope (MVP, jalons J0 à J7)

| Domaine | Contenu |
|---|---|
| Monde | Yopougon entière, 1:1, générée depuis OSM ; relief (MNT) ; eau (lagune Ébrié, baies) ; végétation ; streaming de tuiles de 250 m avec LOD |
| Personnage | Création d'avatar (corps, peau, coiffures dont tresses, tenues ivoiriennes) ; caméra à la 3e personne ; marche, course, saut, s'asseoir |
| Vie quotidienne | Besoins (faim, énergie, hygiène, social, divertissement) ; moteur d'actions générique ; catalogue d'actions ivoirien (§15.6) ; métiers ; inventaire |
| Propriété & commerce | **Louer et acheter** un logement (baux, titres de propriété) ; **ouvrir et gérer un commerce** (maquis, boutique) : stock, prix, caisse, **employés joueurs** (§16.5) |
| Déplacements | Marche, taxi compteur, woro-woro, gbaka, bus SOTRA, moto et voiture personnelles ; PNJ conducteurs ; lignes, arrêts, gares ; trafic d'ambiance |
| Multijoueur | Monde unique persistant, architecture MMO (cellules spatiales, aire d'intérêt, transfert entre serveurs) ; **chat texte de proximité uniquement** (filtre, signalement, limitation de débit) ; émotes ; interactions entre joueurs (discuter, danser, foot, embaucher) |
| Économie | Djai fictif, grand livre en partie double, opérations atomiques et idempotentes (achats, salaires, loyers, achats immobiliers, stocks et recettes des commerces), transferts entre joueurs plafonnés en agence ou au kiosque Mobile Money fictif |
| Comptes | **Invité uniquement**, sans inscription (jeton d'appareil) ; code de récupération affiché au joueur ; un personnage par profil [H]. Le compte permanent est un **point d'extension**, non construit (§20.1) |
| Plateforme | PC, navigateurs Chromium et Firefox récents, clavier et souris ; architecture prête pour le mobile (entrées abstraites, profils de qualité, UI responsive) |
| Langues | **Français** (locale `fr-CI`), avec du **nouchi** dans les dialogues de PNJ ; i18n dès le départ : aucun texte en dur, clés de traduction partout |
| Temps | **Horloge interne du monde**, autoritaire côté serveur, partagée par toutes les zones ; ratio configurable (par défaut 1 jour de jeu = 2 h réelles) ; calendrier de jeu (jours, semaines, mois) (§16.1, ADR 0011) |
| Conformité | Attribution ODbL, publication de la base dérivée, toponymie réelle et marques ou commerces parodiés (§3.4, ADR 0010), loi ivoirienne 2013-450, RGPD (diaspora), modération de base |
| Exploitation | Logs structurés, métriques, traces ; tests de charge par bots ; artefacts de déploiement **préparés** (jamais exécutés, cf. CLAUDE.md) |

### 2.2. Out of scope (explicitement exclu du MVP)

| Exclu | Pourquoi / quand |
|---|---|
| Combat, armes, santé « de combat », mort | [v2] ; points d'extension en §25 |
| Missions scénarisées, quêtes | [v2] ; le moteur d'actions en est le socle |
| Police, criminalité, recherche, prison | [v2] ; drapeau `legality` déjà prévu dans les fiches d'action |
| Avion, aéroport de Port-Bouët | Hors Yopougon ; [v2] avec l'extension à Abidjan |
| Autres communes d'Abidjan | [v2] ; le pipeline est paramétré par commune dès J0 |
| Chat vocal, téléphone en jeu, messagerie privée | Exclus du MVP (décision du propriétaire) : coût, modération, protection des mineurs. Le téléphone est un point d'extension de l'UI (§25) |
| Compte permanent (e-mail, mot de passe, OAuth), connexion multi-appareils | Point d'extension prévu (§20.1), non construit |
| Argent réel, achats intégrés, conversion du Djai | Exclu. Toute ouverture exigerait une analyse réglementaire (jeux d'argent, monnaie électronique) |
| Jeux d'argent (PMU, loto, paris) | Exclu (classification d'âge, réglementation) |
| Commerce libre entre joueurs (hôtel des ventes, revente d'objets entre joueurs) | [v2] ; au MVP, les joueurs échangent via les commerces (achat au comptoir), les salaires et des transferts plafonnés |
| Commerces de joueurs autres que maquis et boutique (salon, garage, transport, immobilier locatif entre joueurs) | [v2] ; le modèle `business` est générique, seuls deux types sont activés au MVP |
| Intérieurs de tous les bâtiments | Exclu. Intérieurs uniquement pour les types de lieux à actions (logement, maquis, salon de coiffure, cybercafé, église, mosquée, banque…), via des gabarits d'intérieur réutilisés |
| Application mobile native, contrôles tactiles | Après la bêta ; l'architecture y est prête |
| Modding, éditeur public | Exclu |

---

## 3. Points de désaccord (contradiction ferme)

Ces points ne brident pas la vision. Ils fixent les conditions pour qu'elle tienne.

### 3.1. « Pas de limite de joueurs »

1. **Désaccord** : aucune architecture ne supporte un nombre illimité de joueurs **au même endroit**.
2. **Pourquoi** : la charge d'une cellule croît en O(n²) avec la densité (chacun voit tout le monde). 2 000 joueurs réunis au même maquis saturent n'importe quel serveur et n'importe quelle connexion 4G.
3. **Alternative retenue** : pas de plafond global (mise à l'échelle horizontale par cellules), mais un **plafond de densité locale** : aire d'intérêt limitée aux K entités les plus pertinentes, débit réduit pour les entités lointaines. Au-delà d'un seuil, des **couches** (copies parallèles d'une cellule saturée) sont prévues comme point d'extension, sans être construites au MVP. Le critère d'acceptation du MVP est un **nombre mesuré** (J5 : 1 000 bots répartis sur la commune et 150 bots dans une même cellule), pas une promesse d'infini.
4. **Décision** : à toi de trancher. Par défaut, c'est ce document qui s'applique.

### 3.2. Rendu semi-réaliste avec trois développeurs et aucun artiste

1. **Désaccord** : le semi-réaliste n'est pas tenable sans capacité artistique dédiée.
2. **Pourquoi** : chiffrage en §12.8, soit **22 à 33 personnes-mois d'art** (kit de façades, personnages et tenues, animations, véhicules, végétation, lieux héros). Trois développeurs qui produisent aussi le moteur, le réseau et le pipeline n'en ont pas la capacité. Sans artiste, la roadmap glisse de 6 à 9 mois, ou bien le rendu reste « maquette grise ».
3. **Alternative retenue** : (a) l'art est de la **donnée** : le code fonctionne avec un kit gris dès J1, et l'art remplace le kit sans toucher au code ; (b) recruter **un artiste 3D / technical artist freelance à temps plein dès J1** [H], complété par des packs d'assets sous licence commerciale ; (c) passer par un **spike de performance du semi-réaliste sur PC modeste** avant toute production en série.
4. **Décision** : à toi de trancher (budget art). Sans artiste, la roadmap s'applique avec la marge indiquée.

### 3.3. Toute la commune avant le gameplay

1. **Désaccord** : générer tout Yopougon (J2) avant d'avoir une boucle de vie jouable (J3) retarde la validation du plaisir de jeu.
2. **Pourquoi** : 2 à 3 mois de travail sur la carte sans savoir si « vivre une vie » est amusant.
3. **Alternative retenue** : J3 démarre sur le **quartier pilote** de J1, **en parallèle** de J2. La roadmap fait se chevaucher J2 et J3.
4. **Décision** : intégré à la roadmap.

### 3.4. Noms de lieux : toponymie réelle, marques et commerces parodiés (décision du propriétaire)

**Décision du propriétaire** (remplace une décision antérieure d'afficher les noms OSM bruts) : sur le modèle des parodies de GTA, les **marques et les commerces** reçoivent un nom **légèrement déformé** (ex. « Orange » → « Oronge », « MTN » → « MTM »), tandis que **la toponymie et les lieux publics** gardent leur nom réel (rues, quartiers, marchés, écoles, lieux de culte, administrations). Cette décision rejoint en grande partie ma recommandation initiale. Le détail est consigné dans l'ADR 0010.

**Réserve (contradiction ferme sur un point)** :
1. **Désaccord** : une déformation **légère** (une lettre changée) ne protège pas à elle seule.
2. **Pourquoi** : en droit des marques (Côte d'Ivoire, Accord de Bangui / OAPI), le critère est le **risque de confusion** ; « Oronge » associé à un kiosque de mobile money peut rester une contrefaçon par imitation. L'exception de parodie est plus étroite et moins prévisible qu'aux États-Unis. Le risque grandit si le nom parodié est accompagné de la couleur ou du logo de la marque.
3. **Alternative retenue** : déformation **assez forte pour éviter toute confusion** (règle de distance minimale, voir plus bas), **jamais** de logo, de couleur dominante ni de charte graphique reproduits, aucun contenu dénigrant, **revue humaine** de la table des grandes marques, retrait sur demande, et validation juridique avant la bêta publique (Q8).
4. **Décision** : à toi de trancher sur la force de la déformation. Par défaut, la règle ci-dessous s'applique.

**Règles de nommage (étape `naming` du pipeline, §11.2)** :
- **Classification** : un objet OSM est « toponymie / public » (`highway`, `place`, `amenity=marketplace|school|place_of_worship|townhall|police|hospital…`, `office=government`) ou « marque / commerce » (`shop=*`, `amenity=restaurant|bar|fast_food|pharmacy|bank|fuel|cafe…`, tout objet portant `brand`, `brand:wikidata` ou `operator` de marque). En cas de doute, la catégorie « commerce » l'emporte.
- **Toponymie / public** : nom OSM conservé tel quel.
- **Marques** : table de correspondance **manuelle** `content/place-names/brand-parodies.json` (« Orange » → « Oronge », « MTN » → « MTM », « Moov » → …), **revue par un humain** (le propriétaire) avant chaque release. Une marque détectée sans entrée dans la table fait **échouer le build** (pas de marque réelle par accident).
- **Autres commerces** : déformation **générée par règle**, **déterministe** (graine = identifiant OSM) : substitutions de syllabes, voyelles et consonnes proches, suffixes ivoiriens plausibles, avec une **distance d'édition minimale** de 2 et ≥ 30 % de la longueur ; résultat contrôlé contre la table des marques (pas de collision avec une marque réelle) et contre une liste de mots injurieux.
- **Surcharges** : `content/place-names/overrides/<osmId>.json` pour corriger un nom généré, ou pour un **retrait sur demande** (remplacement par le libellé générique du type de lieu). Le retrait est appliqué par un **rebuild incrémental de l'étape `naming`**, qui ne touche que les `meta` des tuiles concernées (quelques minutes) ; le hash change et le cache client est invalidé. Délai cible de 72 h ; journal des demandes (`place_name_takedown`).
- **Séparation des couches** : les noms OSM bruts restent dans l'extraction ; les tuiles ne contiennent que le **nom affiché** produit par `naming`. Les tables de parodie et de surcharges sont du contenu propriétaire (`game-authored`) ; les noms affichés qui en résultent font partie de la base dérivée publiée sous ODbL (§21).
- **Mentions légales** : « Les noms de commerces et de marques présents dans le jeu sont fictifs ou parodiques. Toute ressemblance avec une marque existante relève de la parodie et n'implique aucune affiliation ni approbation. Les noms de lieux publics proviennent d'OpenStreetMap. »
- **Aucun contenu dénigrant** associé à un commerce (même parodié) ; en v2, le crime ne cible pas les commerces identifiables.
- Les **commerces gérés par des joueurs** (§16.5) portent un nom choisi par le joueur, modéré, et refusé s'il est trop proche d'une marque de la table (même contrôle de distance).
- Tout nom affiché est **échappé** (donnée externe, jamais interprétée comme du HTML).

### 3.5. Transferts de Djai entre joueurs

1. **Désaccord** : des transferts libres de Djai entre joueurs ouvrent la voie au commerce d'argent réel (achat de Djai contre du vrai argent), au transfert de gains frauduleux et à l'inflation. Le risque augmente avec les commerces et les salaires entre joueurs (§16.5).
2. **Alternative retenue** : transferts **plafonnés** (par jour et par transaction), réalisés en agence ou au kiosque Mobile Money fictif (pas de téléphone au MVP), réservés aux profils ayant au moins 7 jours d'ancienneté et un temps de jeu minimal [H], journalisés et soumis à une détection d'anomalies. Les CGU interdisent la vente de Djai. Les salaires versés par un commerce de joueur passent par un contrat d'emploi (§16.5) et non par un transfert libre.
3. **Décision** : à toi de trancher (plafonds, Q12).

### 3.6. Colyseus

1. **Désaccord** : Colyseus, dans la stack initiale, n'est plus adapté au cœur du jeu.
2. **Pourquoi** : Colyseus est conçu pour des **salles** avec matchmaking. Un monde unique sans salles, découpé en cellules avec transfert transparent et aire d'intérêt entre serveurs, en contourne tous les mécanismes. Il imposerait une reconnexion WebSocket à chaque changement de cellule, ou plusieurs sockets par client.
3. **Alternative retenue** : passerelle WebSocket maison et serveurs de cellules reliés par NATS (ADR 0003). Colyseus est **retiré**. Il pourra être réévalué en v2 pour des mini-jeux à salle fermée (damier, ludo, awalé), si le besoin se confirme.
4. **Décision** : à toi de trancher. C'est un changement de stack structurant.

### 3.7. Horloge interne du monde (décision du propriétaire)

**Décision du propriétaire** : le jeu a sa **propre horloge interne**, sans lien avec le temps universel. Le ratio est configurable ; la valeur par défaut proposée est **1 jour de jeu = 2 h réelles** (facteur 12), à valider (Q13). La conception est détaillée en §16.1 et dans l'ADR 0011.

**Points d'attention** (pas de désaccord, mais des conséquences à assumer) :
- Avec le facteur 12, **une semaine de jeu = 14 h réelles** : des loyers hebdomadaires en temps de jeu tombent plusieurs fois pendant une absence de quelques jours. Sans règle hors ligne adaptée, un joueur occasionnel perdrait son logement. La règle proposée (§16.1) traite ce point.
- Une action longue (dormir 8 h de jeu = 40 min réelles) doit être **compressée** (« ellipse ») pour rester jouable.
- Un cycle de 2 h fait qu'un joueur qui se connecte une heure voit **la moitié d'une journée** : c'est l'avantage recherché (tous les joueurs voient le jour et la nuit), au prix d'horaires d'ouverture qui défilent vite. Les plages d'ouverture des lieux doivent donc être larges.

### 3.8. Commerces de joueurs avec employés dès le MVP (décision du propriétaire)

1. **Désaccord** : les commerces gérés par des joueurs qui emploient d'autres joueurs sont le système le plus risqué du MVP, à la fois pour l'économie et pour la charge de travail.
2. **Pourquoi** : stocks, prix libres, caisse, contrats et salaires entre joueurs multiplient les chemins d'argent (inflation, blanchiment, arnaques entre joueurs), la modération (noms, prix abusifs) et les cas de concurrence (deux employés vendent le dernier article). C'est environ **6 à 8 semaines** de travail en plus.
3. **Alternative retenue** (sans renverser la décision) : construire le modèle générique (`business`, `employment_contract`, `stock`, `price_list`) dès le MVP, mais **activer deux types seulement** (maquis, boutique), avec des **prix bornés** (fourchette par article dans `content/`), un stock acheté uniquement à un **grossiste système**, des **salaires prélevés d'avance sur la caisse du commerce** (séquestre), des plafonds et un journal complet. L'ouverture d'un commerce est soumise à l'achat ou à la location d'un local commercial. Livraison au jalon J6.
4. **Décision** : intégré. Les plafonds sont à confirmer (Q12).

### 3.9. Invité uniquement au MVP (décision du propriétaire)

1. **Point d'attention** (pas de désaccord) : un profil invité lié à un jeton d'appareil est **perdu** si le joueur vide son navigateur ou change d'appareil, ce qui est gênant quand il possède une maison ou un commerce.
2. **Atténuation** : le jeton d'invité est aussi présenté comme **code de récupération** (affiché à la création et dans les paramètres, copiable), qui permet de restaurer le profil sur un autre navigateur. Le compte permanent reste un point d'extension (§20.1) : la table `account` prévoit déjà `kind` et des champs d'identifiants nullables.

---

## 4. Hypothèses de travail

| ID | Hypothèse | Impact si fausse |
|---|---|---|
| H1 | Équipe = propriétaire + Aristide Adouko + smartdev1, soit environ **2,5 ETP de développement** (le propriétaire tient aussi le rôle de PO et de concepteur de contenu) | Durées à recalculer au prorata |
| H2 | **1 artiste 3D / technical artist freelance à temps plein** à partir de J1, plus un budget de packs d'assets de 3 000 à 8 000 € | Sans lui : +6 à 9 mois, ou un rendu gris |
| H3 | **Aucune échéance** (décision du propriétaire) : la roadmap est en jalons, avec des durées **indicatives** ; objectif de **bêta fermée** en fin de J7 | — |
| H4 | Budget d'hébergement **décidé à la mise en production** : l'architecture démarre en local ou sur **un seul VPS** (mode `all-in-one`) et monte en charge horizontalement ; coûts indicatifs par palier en §6.4 | — |
| H5 | Machine de référence **basse** : portable Core i5 8e gén. ou Ryzen 5 3500U, GPU intégré (Intel UHD 620 / Vega 8), 8 Go de RAM, Chrome, 1080p | Budgets de rendu à revoir |
| H6 | Machine de référence **moyenne** : GPU dédié de classe GTX 1060 / RX 580, 16 Go | — |
| H7 | La couverture OSM de Yopougon est suffisante pour le bâti (à mesurer au spike SP2) ; les hauteurs sont manquantes à environ 90 % | Compléter avec des jeux de données ouverts (§21.3) |
| H8 | Postes de développement Windows et Linux : tout l'outillage doit être multiplateforme (Node, pnpm, Docker Desktop pour les outils natifs) | — |
| H9 | Un personnage par profil invité au MVP | Schéma prêt pour N personnages |
| H10 | Temps du monde = **horloge interne** ; ratio par défaut 1 jour de jeu = 2 h réelles (à valider, Q13) ; règle hors ligne proposée en §16.1 (Q14) | Équilibrage des besoins, loyers et salaires |

---

## 5. Principes d'architecture

1. **Le monde est de la donnée.** Géométrie, collisions, lieux, actions, lignes de transport, métiers et prix sont produits par le pipeline ou écrits dans `content/`. Le code ne contient aucune coordonnée de Yopougon.
2. **Serveur autoritaire.** Le client envoie des **intentions** (entrées, demandes d'action) et ne transmet jamais d'état final. Il prédit son propre déplacement, et tout le reste est décidé par le serveur.
3. **Une source de vérité par donnée.** Monde statique : artefacts du pipeline. État dynamique : la cellule propriétaire. Argent et progression durable : PostgreSQL, via le service Économie ou Personnages.
4. **Logique pure séparée des moteurs.** Les règles (physique 2,5D, besoins, actions, horaires de transport) sont du TypeScript pur, testable sans Babylon, Node, PostgreSQL ou NATS. Elles sont partagées entre client (prédiction et aperçu) et serveur (autorité).
5. **Ports et adaptateurs aux frontières.** Une cellule ne connaît pas Prisma ; elle parle à un `EconomyPort`. On peut tester avec un adaptateur en mémoire et déployer avec l'adaptateur NATS.
6. **Commencer en un processus, découper ensuite.** Le même code tourne en mode « tout-en-un » (développement local, tests) et en mode distribué (passerelles, N serveurs de zone, services). Le bus a une implémentation en mémoire et une implémentation NATS.
7. **Déterminisme.** Le pipeline est reproductible octet pour octet : instantané OSM figé, graines dérivées des identifiants OSM, aucun `Math.random`. Les horaires des véhicules de ligne sont des fonctions du temps.
8. **Mesurer avant d'optimiser.** Les budgets (FPS, mémoire, bande passante, temps de tick) sont fixés dès J0 et mesurés à chaque jalon sur les machines de référence.
9. **Modularité stricte.** Ni fichier fourre-tout, ni god-class, ni JSON monolithique (§9).

---

## 6. Architecture cible

### 6.1. Vue d'ensemble

```text
                       ┌──────────────────────────────────────────────┐
                       │ Stockage objet + CDN (tuiles, kits, contenu) │  fichiers immuables,
                       │ URLs adressées par hash                      │  cache HTTP longue durée
                       └───────────────▲──────────────────────────────┘
                                       │ HTTPS GET (tuiles, glb, ktx2, contenu compilé)
┌──────────────────────┐               │
│  Client web          │───────────────┘
│  apps/web            │── HTTPS /api/v1 ──► ┌────────────────────────────┐
│  Babylon.js + Preact │                     │ apps/services              │──► PostgreSQL
│  prédiction, rendu,  │                     │ (monolithe modulaire)      │    (Prisma)
│  streaming, UI       │                     │ comptes · personnages ·    │
└──────────┬───────────┘                     │ économie · logement ·      │
           │ WSS (binaire, 1 socket)         │ modération · vie privée ·  │
           ▼                                 │ tickets de session         │
┌──────────────────────┐                     └─────────────▲──────────────┘
│ apps/gateway (×N)    │  auth du ticket, validation,      │ requêtes/réponses NATS
│ sans état de jeu     │  limitation de débit, routage     │ (svc.economy.*, svc.character.*)
└──────────┬───────────┘                                   │
           │ NATS (cell.{id}.in / gw.{id}.out)             │
           ▼                                               │
┌───────────────────────────────────────────────────────────┴───┐
│ apps/zone (×N processus), chacun héberge 1..k CELLULES         │
│ cellule = autorité sur une région (par défaut 1 km × 1 km)     │
│ tick 20 Hz : entrées → physique → actions → besoins →          │
│ transport → PNJ fonctionnels → aire d'intérêt → instantanés    │
│ fantômes aux frontières, transferts d'entités entre cellules   │
└────────────────────────────────────────────────────────────────┘
           ▲
           │ annuaire des cellules (NATS JetStream KV, baux)
┌──────────┴───────────┐
│ NATS (+ JetStream)   │
└──────────────────────┘

Hors ligne : tools/map-pipeline  (instantané OSM → tuiles + collisions + métadonnées + manifeste)
             tools/content-cli   (content/*.json → validation Zod → paquets de contenu compilés)
             tools/asset-pipeline(glb sources → contrôle, meshopt, KTX2, atlas, tableaux de textures)
             tools/bots          (clients sans affichage pour les tests de charge)
```

### 6.2. Composants et responsabilités

| Composant | Responsabilité | N'a **pas** le droit de |
|---|---|---|
| `apps/web` | Rendu, streaming, entrées, prédiction du joueur local, interpolation des autres, UI | Décider d'un gain, d'un coût, d'un résultat d'action ; accéder à autre chose que l'API HTTP, la passerelle et le CDN |
| `apps/gateway` | Terminer les WebSockets ; vérifier le ticket de session ; décoder, valider et limiter les messages ; router vers la cellule propriétaire ; renvoyer les instantanés | Simuler le jeu ; accéder à la base |
| `apps/zone` | Simulation autoritaire des cellules ; aire d'intérêt ; fantômes ; transferts ; exécution des actions ; besoins ; véhicules ; PNJ fonctionnels | Accéder à PostgreSQL (passer par les ports) ; écrire un solde |
| `apps/services` | Comptes, sessions, personnages (chargement et points de sauvegarde), économie (grand livre), logement, métiers persistants, modération, export et suppression RGPD, émission des tickets de session | Simuler le monde |
| NATS | Bus de messages entre passerelles, zones et services ; KV pour l'annuaire des cellules | Stocker des données métier durables |
| PostgreSQL | Source de vérité durable | — |
| Stockage objet + CDN | Distribution des artefacts statiques (tuiles, assets, contenu) | — |

### 6.3. Modes d'exécution

| Mode | Usage | Composition |
|---|---|---|
| `all-in-one` | Développement local, tests d'intégration, J1 à J4 | Un processus Node qui héberge passerelle, zone (toutes les cellules) et services, avec un bus en mémoire. Seul PostgreSQL est externe (Docker), et il est même optionnel jusqu'à J6 grâce aux adaptateurs en mémoire |
| `distributed` | J5+, tests de charge, bêta | Passerelles ×N, zones ×N, services ×1..N, NATS, PostgreSQL |

Le passage d'un mode à l'autre ne doit demander **aucune modification de code métier**, seulement la composition (`main.ts`) et la configuration.

### 6.4. Paliers d'hébergement (coûts indicatifs, à titre d'information)

Le budget sera décidé à la mise en production (H4). Les montants ci-dessous sont des **ordres de grandeur** d'octobre 2026 chez des hébergeurs VPS européens généralistes (trafic inclus important) ; ils sont à recalculer au moment du choix. CCU = joueurs connectés simultanément (pic).

| Palier | CCU (pic) | Topologie | Coût mensuel indicatif |
|---|---|---|---|
| **P0** Local / alpha | ≤ 50 | Poste de dev ou **1 VPS** 4 vCPU / 8 Go : mode `all-in-one` (passerelle + zone + services en un processus, bus en mémoire) + PostgreSQL sur la même machine ; tuiles servies par un stockage objet ou par le VPS | 15 – 50 € |
| **P1** Bêta fermée | ≤ 300 | 2 VPS : (a) app `all-in-one` 8 vCPU, (b) PostgreSQL + sauvegardes ; stockage objet + CDN pour les tuiles | 60 – 180 € |
| **P2** Bêta ouverte | ≤ 1 500 | Mode `distributed` : 2 passerelles, 3 à 5 processus de zone, 2 services, NATS (3 nœuds légers), PostgreSQL managé ou dédié avec réplique | 300 – 900 € |
| **P3** Lancement | ≤ 10 000 | 6 à 10 passerelles, 15 à 30 processus de zone, services ×3, NATS en grappe, PostgreSQL dédié + réplique de lecture, observabilité dédiée | 2 000 – 6 000 € |

Points de vigilance : (1) **bande passante temps réel** : 8 à 25 Ko/s par joueur, soit environ 20 à 65 Go par joueur-mois de jeu continu, d'où le choix d'hébergeurs à trafic inclus ; (2) **tuiles** : le jeu complet de Yopougon pèse environ 2 à 3 Go (toutes LOD) ; un nouveau joueur télécharge 50 à 200 Mo en explorant. Un stockage objet **sans frais de sortie** ou un CDN gratuit en entrée de gamme rend ce poste négligeable ; (3) la **latence** depuis Abidjan décide de la région (spike SP4) ; (4) un hébergement hors de Côte d'Ivoire est un transfert de données à encadrer (§20.3).

Le passage d'un palier à l'autre est une **opération de déploiement** (ajout de processus, attribution des cellules), pas un chantier de code (§6.3).

---

## 7. Stack & justification

| Domaine | Choix | Statut vs existant | Justification | Alternatives écartées |
|---|---|---|---|---|
| Langage | TypeScript `strict` partout | Garder | Partage de code client/serveur, équipe déjà en place | — |
| Runtime serveur | **Node.js 24 LTS** | Mettre à jour (≥18 aujourd'hui) | LTS jusqu'en 2028, `worker_threads` pour le pipeline | Bun, Deno : moins éprouvés pour notre outillage et sous Windows |
| Gestionnaire de monorepo | **pnpm workspaces** | Remplacer npm | `node_modules` strict : une dépendance non déclarée échoue, ce qui renforce les frontières entre paquets ; lockfile unique ; rapide sous Windows | npm (dépendances fantômes, double lockfile actuel) ; Nx et Turborepo (inutiles à notre taille) |
| Moteur 3D | **`@babylonjs/core`** (modules ES, dernière majeure stable), `@babylonjs/loaders`, `@babylonjs/materials` au besoin | **Remplacer** `babylonjs` UMD | Tree-shaking, imports explicites, support natif de glTF, meshopt, KTX2, thin instances, tableaux de textures (WebGL2), animation par textures de sommets, WebGPU optionnel | three.js (réécriture de l'existant, moins d'outillage intégré) ; Unity WebGL (bundle lourd, pas de partage TS) |
| Triangulation | `earcut` côté **pipeline** (hors ligne) | Ajouter | Corrige M1 : les polygones sont triangulés hors ligne, le client ne triangule plus | Triangulation au chargement dans le client |
| UI | **Preact + @preact/signals**, HTML et CSS | Nouveau | Menus riches (inventaire, catalogue d'actions, gestion de commerce, carte, chat), accessibilité, responsive pour le mobile ; environ 4 Ko | Babylon GUI pour l'UI 2D (peu accessible, pas responsive) ; React (plus lourd) |
| Build client | **Vite** | Garder | Déjà en place, workers ES, multiplateforme | — |
| Transport temps réel | **WebSocket binaire** via `ws` dans la passerelle, isolé derrière une interface `TransportServer` | **Remplace Colyseus** | Une seule socket par client, transferts transparents entre cellules, protocole binaire compact | Colyseus (cf. §3.6) ; uWebSockets.js (à réévaluer si les tests de charge le justifient, l'interface le permet) ; WebTransport (datagrammes non fiables, prévu après la bêta) |
| Bus interne | **NATS** (+ JetStream KV pour l'annuaire des cellules) | Nouveau, introduit à **J5** | Pub/sub et requête/réponse à faible latence, binaire unique multiplateforme, sujets hiérarchiques adaptés aux cellules (`cell.{id}.*`) ; KV avec baux pour la propriété des cellules | Redis pub/sub (pas de requête/réponse native, persistance pub/sub nulle) ; Kafka (surdimensionné) |
| Cache / présence | **Pas de Redis** au MVP | — | PostgreSQL et NATS KV couvrent les besoins ; un composant de moins à exploiter | Redis : à introduire seulement si une mesure le justifie |
| API HTTP | **Fastify** | Remplace Express | Validation de schéma, performances, typage, hooks de sécurité | Express (déjà là, mais moins structurant) |
| Base de données | **PostgreSQL 16+** | Garder | Transactions ACID pour l'économie, contraintes d'unicité, JSONB pour les apparences | — |
| ORM | **Prisma** (version majeure courante) avec **SQL brut paramétré** pour le grand livre | Garder (schéma à réécrire) | Continuité avec l'équipe ; les écritures économiques passent par des requêtes SQL explicites dans une transaction `SERIALIZABLE` ou avec verrou de ligne | Drizzle et Kysely (meilleurs en SQL complexe, mais rupture de continuité) |
| Validation | **Zod v4** | Trancher (« Zod/Valibot à choisir ») | Génération native de JSON Schema (autocomplétion de `content/` dans VS Code), écosystème. Le chemin chaud réseau n'utilise pas Zod (codec binaire borné) | Valibot (plus léger, mais génération de JSON Schema moins mûre) |
| Sérialisation | Codec binaire maison borné (chemin chaud) ; **MessagePack** + Zod (messages de contrôle) | Nouveau | Positions quantifiées, deltas ; contrôle de taille | JSON (trop verbeux à 20 Hz) ; Protobuf (chaîne de génération en plus) |
| Pipeline OSM | **osmium-tool** (dans une image Docker) pour l'extraction, puis étapes **Node/TS** | Remplacer overpass-turbo manuel | Extraction déterministe depuis un instantané Geofabrik figé, découpage par la limite administrative | Overpass scripté (dépend de serveurs publics, quotas) : toléré en secours uniquement |
| Géométrie hors ligne | `earcut`, `flatbush` (index spatial), `polygon-clipping` ou Clipper2 (WASM), conversion UTM maison testée | Nouveau | Corrige le O(n²) de `RoadNetwork` (C2) | — |
| Assets | glTF binaire, **meshopt** (`EXT_meshopt_compression`), **KTX2/Basis** (ETC1S couleur, UASTC normales), `gltf-transform` | Nouveau | Taille et mémoire GPU, transcodage mobile | Draco (décodage plus lent, sans gain d'instanciation) |
| Tests | **Vitest**, **fast-check** (propriétés), **Playwright** (e2e client), bots Node (charge) | Garder Vitest | — | — |
| Lint / frontières | ESLint (flat config) + `typescript-eslint`, **dependency-cruiser**, Prettier | Nouveau | Règles de modularité automatisées (§9) | — |
| Observabilité | **pino** (logs JSON), **OpenTelemetry** (métriques, traces), Prometheus + Grafana + Loki (préparés en Docker Compose) | Nouveau | Standard, gratuit, multiplateforme | — |
| Conteneurs | Docker / Docker Compose (dev : PostgreSQL, NATS, osmium, observabilité) | Nouveau | Postes Windows et Linux identiques | — |

---

## 8. Arborescence cible du monorepo

Règle de lecture : chaque dossier a **une** responsabilité. Les noms sont en anglais (code).

```text
skyline/
├── ARCHITECTURE.md                  # ce document
├── README.md                        # démarrage rapide (Windows + Linux), liens vers docs/
├── ATTRIBUTION.md                   # © contributeurs OpenStreetMap (ODbL) + autres sources de données
├── LICENSE                          # licence du code (à choisir, Q9)
├── package.json                     # scripts racine uniquement (lint, typecheck, test, dev)
├── pnpm-workspace.yaml
├── tsconfig.base.json               # strict ; aucun "lib" DOM ici
├── tsconfig.{browser,node,pure}.json# profils hérités par les paquets
├── eslint.config.js                 # règles de modularité (§9)
├── .dependency-cruiser.cjs          # matrice de dépendances (§9.3)
├── .env.example                     # valeurs factices uniquement
│
├── apps/
│   ├── web/                         # CLIENT navigateur
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── app/                 # main.ts (racine de composition ≤ 60 lignes), séquence de démarrage, config
│   │       ├── engine/              # création Engine (WebGL2/WebGPU), boucle de frame, profils de qualité, origine flottante
│   │       ├── streaming/           # planificateur de tuiles, sélection de LOD, cache (Cache API), budget de chargement
│   │       ├── workers/             # web workers : décodage de tuiles, préparation des buffers d'instances
│   │       ├── world-render/
│   │       │   ├── terrain/         # maillage du relief par tuile
│   │       │   ├── water/           # lagune, baies
│   │       │   ├── roads/           # chaussées, trottoirs, marquages
│   │       │   ├── buildings/       # assemblage des façades (thin instances de modules), toits
│   │       │   ├── props/           # mobilier urbain instancié
│   │       │   ├── vegetation/      # arbres instanciés, imposteurs
│   │       │   ├── far-field/       # LOD 2-3, imposteurs de bâtiments
│   │       │   ├── materials/       # matériaux PBR partagés, plugins (teinte, salissure, index de tableau de textures)
│   │       │   └── lighting/        # soleil, ciel, cycle jour/nuit, ombres
│   │       ├── characters/          # assemblage d'avatar modulaire, animation, foule (VAT)
│   │       ├── vehicles/            # vues des véhicules (aucune règle)
│   │       ├── input/               # clavier/souris/manette → InputIntent (tactile plus tard)
│   │       ├── player/              # contrôleur local (prédiction via @skyline/physics), caméra 3e personne
│   │       ├── net/                 # client passerelle, synchro d'horloge, réconciliation, tampon d'interpolation
│   │       ├── interaction/         # détection de sites, modèle du menu d'actions, progression affichée
│   │       ├── ambient/             # foule et trafic d'ambiance purement visuels (non synchronisés)
│   │       ├── audio/               # ambiances par type de lieu, sons spatialisés
│   │       ├── ui/                  # Preact : hud/, chat/, wallet/, inventory/, business/, housing/, map/, menus/, avatar-editor/, legal/ (attribution, mentions)
│   │       ├── i18n/                # chargement des catalogues de traduction, formatage (nombres, Djai, heures) ; aucune chaîne en dur ailleurs
│   │       └── debug/               # caméra libre (reprise de l'existant), overlay perf, bornes de tuiles
│   │
│   ├── gateway/                     # PASSERELLE WebSocket
│   │   └── src/
│   │       ├── app/                 # main.ts (composition)
│   │       ├── transport/           # serveur ws derrière TransportServer
│   │       ├── auth/                # vérification du ticket de session (usage unique)
│   │       ├── session/             # état de connexion, limitation de débit, compteur de violations
│   │       ├── routing/             # lookup cellule propriétaire (annuaire), redirection lors des transferts
│   │       └── backpressure/        # file sortante bornée, abandon d'instantanés périmés
│   │
│   ├── zone/                        # SERVEUR DE CELLULES (simulation autoritaire)
│   │   └── src/
│   │       ├── app/                 # main.ts, chargement des cellules attribuées
│   │       ├── cell/                # CellRuntime, boucle de tick, registre d'entités
│   │       ├── entities/            # composants (transform, avatar, vehicle, npc, seat) ; ECS léger
│   │       ├── world-data/          # chargement collisions + sites + arrêts depuis les tuiles de la cellule (+ marge)
│   │       ├── movement/            # file d'entrées, application de @skyline/physics, validation vitesse/collision
│   │       ├── interest/            # hachage spatial, ensembles d'intérêt, priorités, débits
│   │       ├── replication/         # instantanés de base + deltas par client, quantification
│   │       ├── handoff/             # protocole de transfert, fantômes aux frontières
│   │       ├── actions/             # liaison de @skyline/sim-actions à l'état du monde, réservation de sites
│   │       ├── needs/               # système de besoins (tick)
│   │       ├── transport/           # véhicules de ligne, répartiteur de taxis, embarquement
│   │       ├── npc/                 # PNJ fonctionnels (vendeuse, chauffeur, coiffeuse…)
│   │       ├── chat/                # chat de proximité, filtre, limitation
│   │       ├── ports/               # EconomyPort, CharacterStorePort, ClockPort… (interfaces)
│   │       └── adapters/            # implémentations NATS et en mémoire des ports
│   │
│   └── services/                    # MONOLITHE MODULAIRE (HTTP + gestionnaires NATS)
│       └── src/
│           ├── app/                 # main.ts, serveur Fastify, abonnements NATS
│           └── modules/
│               ├── accounts/        # profil invité (jeton d'appareil, code de récupération), sessions ; point d'extension compte permanent
│               ├── session-tickets/ # émission de tickets de connexion à la passerelle
│               ├── characters/      # création, chargement, points de sauvegarde
│               ├── economy/         # grand livre, idempotence, plafonds, puits/sources
│               ├── property/        # biens, baux, loyers périodiques, titres de propriété, achats et ventes au système
│               ├── business/        # commerces de joueurs : ouverture, stock, prix bornés, caisse, contrats d'emploi, séquestre des salaires
│               ├── world-clock/     # segments d'horloge (ratio, pause), persistance et publication NATS KV ; échéances récurrentes (loyers, PNJ gérants)
│               ├── employment/      # emplois tenus, progression persistante
│               ├── moderation/      # signalements, sanctions, mots filtrés
│               └── privacy/         # consentements, export, suppression, rétention
│              # chaque module : api/ (routes + DTO), application/ (cas d'usage), domain/, infra/ (Prisma), bus/
│
├── packages/                        # BIBLIOTHÈQUES (frontières strictes, cf. §9.3)
│   ├── geo/                         # [pur] WGS84 ↔ UTM 30N ↔ local ; TileKey, CellKey ; maths de grille
│   ├── tile-format/                 # [pur] schémas meta/manifeste, codec collision.bin, conventions de nommage des fichiers
│   ├── protocol/                    # [pur] version, messages, codecs binaires bornés, codes d'erreur
│   ├── physics/                     # [pur] contrôleur de personnage 2,5D, véhicule arcade, requêtes de collision
│   ├── content-schema/              # [pur] schémas Zod du contenu (actions, métiers, objets, types de lieux, lignes…)
│   ├── sim-clock/                   # [pur] horloge de jeu partagée, calendriers, fenêtres horaires
│   ├── sim-needs/                   # [pur] décroissance et effets des besoins
│   ├── sim-actions/                 # [pur] moteur d'actions : conditions, effets, machine à états
│   ├── sim-transport/               # [pur] horaires, position déterministe des véhicules de ligne, tarifs, routage
│   ├── economy-rules/               # [pur] calcul de prix, bornes de prix, plafonds ; aucune écriture
│   ├── business-rules/              # [pur] règles des commerces : stock, marge, contrat d'emploi, partage de recette ; aucune écriture
│   ├── i18n/                        # [pur] format des catalogues, résolution de clés, pluriels, registre (standard / nouchi)
│   ├── bus/                         # [node] interface MessageBus, sujets typés, impl. mémoire + NATS
│   ├── observability/               # [node] logger pino, métriques OTel, contexte de trace
│   └── db/                          # [node] schéma Prisma, migrations, client ; importé UNIQUEMENT par apps/services
│
├── content/                         # CONTENU DE JEU (propriétaire, NON dérivé d'OSM) : un fichier par définition
│   ├── actions/<categorie>/<id>.action.json
│   ├── jobs/<id>.job.json
│   ├── items/<categorie>/<id>.item.json
│   ├── place-types/<id>.place.json  # maquis, salon, église… → sites d'action, intérieur, horaires
│   ├── transport/lines/<id>.line.json, transport/fares/<mode>.fare.json
│   ├── needs/needs.config.json      # taux (petit fichier de paramètres, pas un fourre-tout)
│   ├── housing/<type>.housing.json
│   ├── businesses/<type>.business.json   # maquis, boutique : articles vendables, fourchettes de prix, postes d'employés
│   ├── place-names/brand-parodies.json, place-names/overrides/<osmId>.json, place-names/offensive-words.json   # nommage parodique (ADR 0010), revue humaine
│   ├── game-config/clock.json, game-config/calendar.json   # ratio de temps, calendrier de jeu (paramètres, pas du contenu narratif)
│   ├── dialogues/<pnj-role>/<id>.dialogue.json   # répliques de PNJ (clés i18n, registre nouchi)
│   ├── appearance/<slot>/<id>.json  # coiffures, tenues
│   ├── interiors/<template>.interior.json
│   └── i18n/fr-CI/<domaine>.json  # une seule langue au MVP ; structure prête pour d'autres locales
│
├── tools/
│   ├── map-pipeline/                # CLI hors ligne OSM → tuiles (cf. §11)
│   │   ├── config/<commune>.pipeline.json   # ex. yopougon.pipeline.json
│   │   └── src/{cli,stages,geometry,heuristics,writers}/
│   ├── content-cli/                 # validation de content/, génération JSON Schema, compilation en paquets
│   ├── asset-pipeline/              # contrôle des glb (nommage, échelle, budgets), meshopt, KTX2, atlas
│   └── bots/                        # clients sans affichage pour les tests de charge
│
├── assets-src/                      # sources d'art (Git LFS) : .blend, textures sources ; jamais servi tel quel
├── data/                            # (ignoré par git sauf manifestes)
│   ├── sources/sources.lock.json    # VERSIONNÉ : instantané OSM (URL, date, sha256), limite, MNT
│   ├── cache/                       # téléchargements (ignoré)
│   └── build/<commune>/<release>/   # sortie du pipeline (ignoré), publiée vers le stockage objet
│
├── infra/                           # PRÉPARÉ, JAMAIS EXÉCUTÉ PAR LES AGENTS
│   ├── docker/                      # Dockerfiles par app, image osmium
│   ├── compose/                     # dev : postgres, nats, observabilité
│   └── observability/               # tableaux de bord Grafana, règles d'alerte
│
├── tests/
│   ├── e2e/                         # Playwright
│   ├── integration/                 # scénarios multi-composants (mode all-in-one)
│   └── load/                        # scénarios de bots, seuils
│
└── docs/
    ├── adr/                         # décisions
    ├── backlog/                     # T-xxx
    ├── roadmap.md
    ├── cartographie-projet.md
    ├── conventions.md               # (J0) renvoie à §9 et §27 de ce document
    ├── spikes/                      # comptes rendus de spikes
    ├── runbooks/
    ├── tech-debt.md
    └── archive/                     # CDC v1.1, dossier LD, plans d'assets (supersédés)
```

Les tests unitaires vivent **à côté** du code (`foo.ts` / `foo.test.ts`) ; `tests/` ne contient que les tests transverses.

---

## 9. Règles de modularité (non négociables)

### 9.1. Taille et responsabilité

| Règle | Seuil | Outil |
|---|---|---|
| Lignes par fichier source (hors tests et fichiers générés) | cible ≤ 250 ; **erreur à 400** | ESLint `max-lines` |
| Lignes par fichier de test | erreur à 600 | ESLint |
| Lignes par fonction | avertissement à 50 ; **erreur à 80** | `max-lines-per-function` |
| Complexité cyclomatique | erreur à 12 | `complexity` |
| Paramètres par fonction | 4 maximum (au-delà, un objet typé) | `max-params` |
| Dépendances injectées par classe | 6 maximum (au-delà, découper) | revue |
| Fichiers source par dossier | 12 maximum (au-delà, sous-dossiers par concept) | script CI |
| `main.ts` de chaque app | **≤ 60 lignes** : composition uniquement, aucune logique | revue + `max-lines` dédié |
| Fichier de données versionné | ≤ 1 Mo (fixtures de test) ; aucune sortie du pipeline versionnée | hook pre-commit + CI |
| Fichier de contenu | **une définition par fichier** (`content/**`) | content-cli |

### 9.2. Interdits

- Noms de fichiers ou de modules fourre-tout : `utils`, `helpers`, `common`, `misc`, `shared` (dans un paquet), `stuff`, `core.ts`, `types.ts` de plus de 150 lignes, `*Manager` générique (`GameManager`, `WorldManager`). Un nom dit **ce que fait** le module (`tile-lod-selector.ts`, `wallet-transfer.ts`).
- Barrels internes : seul `src/index.ts` d'un paquet (son API publique) ré-exporte. **Aucun import profond** dans un autre paquet (`@skyline/geo/src/...` est interdit).
- Dépendances circulaires, entre paquets comme entre fichiers.
- `any` (erreur de lint). Les données externes entrent en `unknown`, puis sont validées.
- Singletons mutables globaux et état de module mutable. Les dépendances passent par la racine de composition.
- JSON monolithique du monde (`world.json`) : le monde est découpé en tuiles, le contenu en fichiers unitaires.
- Coordonnées, prix, durées et identifiants de lieux codés en dur dans le code (ils vivent dans `content/` ou dans les tuiles).
- `Math.random` dans le pipeline et la simulation : `SeededRng` uniquement (graine explicite).
- Chemins absolus et séparateurs `\` codés en dur : `node:path` et URL uniquement (postes Windows).

### 9.3. Matrice des dépendances autorisées

`→` signifie « peut importer ». Tout ce qui n'est pas listé est **interdit** et vérifié par dependency-cruiser en CI.

| Depuis \ vers | paquets **[pur]** | `bus`, `observability` | `db` | `@babylonjs/*`, `preact` | API Node (`fs`, `net`…) | autres `apps/*` |
|---|---|---|---|---|---|---|
| paquets **[pur]** (`geo`, `tile-format`, `protocol`, `physics`, `content-schema`, `sim-*`, `economy-rules`, `business-rules`, `i18n`) | ✔ (sans cycle) + `zod` | ✘ | ✘ | ✘ | ✘ (`lib` ES2023 uniquement, ni DOM ni Node) | ✘ |
| `bus`, `observability` | ✔ | ✔ | ✘ | ✘ | ✔ | ✘ |
| `db` | ✘ | ✘ | — | ✘ | ✔ | ✘ |
| `apps/web` | ✔ | ✘ | ✘ | ✔ | ✘ | ✘ |
| `apps/gateway` | `protocol`, `geo` | ✔ | ✘ | ✘ | ✔ | ✘ |
| `apps/zone` | ✔ | ✔ | **✘** | ✘ | ✔ | ✘ |
| `apps/services` | ✔ | ✔ | ✔ | ✘ | ✔ | ✘ |
| `tools/*` | ✔ | `observability` | ✘ | ✘ | ✔ | ✘ |

Au sein d'une app, la même logique s'applique : `apps/web/src/world-render` n'importe pas `ui`, `ui` n'importe pas `world-render` ; ils communiquent par des stores (signals) exposés par `app/`. Dans `apps/services/src/modules/X`, un module n'importe jamais `infra/` d'un autre module, seulement son `application/` public.

### 9.4. Ajout d'un paquet ou d'une dépendance

Un nouveau paquet exige une ligne dans la matrice §9.3 et une justification dans la PR. Une nouvelle dépendance npm exige l'accord du propriétaire (CLAUDE.md) ainsi qu'une vérification de licence (pas de GPL ni d'AGPL dans le client ni dans les serveurs ; MIT, BSD, Apache-2.0 et ISC acceptées).

---

## 10. Monde : référentiel géographique, tuiles, streaming

### 10.1. Référentiel

- **Projection unique pour tout Abidjan** : UTM zone 30N (EPSG:32630), métrique et conforme. Abidjan (≈ 4,0° O) est dans la zone 30 (6° O → 0°). Cela remplace l'équirectangulaire locale centrée sur la bbox, qui changeait d'origine à chaque export, et **supprime la normalisation à 300** (bug C1).
- **Origine de grille fixe** : coin sud-ouest arrondi au kilomètre, englobant le District d'Abidjan avec une marge (valeur fixée dans `@skyline/geo`, testée). Elle ne change jamais, ce qui rend les identifiants de tuiles stables d'une commune et d'une release à l'autre.
- **Axes moteur** : x = est, y = haut, z = nord (cohérent avec l'existant et Babylon main gauche). **1 unité = 1 mètre.** Une seule fonction de conversion, dans `@skyline/geo`.
- **Précision** : le client fait du rendu en **origine flottante**. Le monde est rebasé autour de la tuile du joueur dès qu'il s'éloigne de plus de 1 km de l'origine courante. Les fichiers de tuile stockent leurs sommets **en coordonnées locales à la tuile** (float32 précis au millimètre). Le serveur travaille en float64.

### 10.2. Grille et hiérarchie (ADR 0002)

| Niveau | Taille | Contenu | Rayon de chargement indicatif (à pied / en véhicule) |
|---|---|---|---|
| **L0** | 250 m × 250 m | Détail complet : listes d'instances de modules de façade, toits, routes, trottoirs, props, végétation, collisions, sites | ≤ 300 m / ≤ 450 m dans le sens du déplacement |
| **L1** | 500 m (2×2 L0) | Bâtiments simplifiés (extrusions texturées par atlas), routes fusionnées, végétation en lots | ≤ 900 m |
| **L2** | 1 km (4×4 L0) | Masses de bâtiments en imposteurs, canopée en cartes | ≤ 2 km |
| **L3** | 2 km | Relief et silhouettes fusionnées | jusqu'à la brume (≈ 3 à 4 km) |

- Clé de tuile : `L{niveau}_{i}_{j}` (i vers l'est, j vers le nord, dans la grille fixe). Ordre de grandeur pour Yopougon (≈ 153 km²) : **environ 2 500 tuiles L0** couvrant la commune (plus les tuiles de bordure de la bbox), soit environ 650 L1, 170 L2 et 45 L3.
- **Cellule serveur** (autorité) ≠ tuile (contenu). Une cellule regroupe par défaut 4×4 tuiles L0 (1 km²). Elle peut être scindée en 2×2 (500 m) puis en 1 tuile dans les zones chaudes (marché, Rue Princesse). La frontière d'une cellule est toujours alignée sur la grille des tuiles.

### 10.3. Fichiers d'une tuile L0

```text
tiles/L0/{i}_{j}/
  geom.{hash}.glb        # meshopt ; maillages fusionnés par matériau (routes, toits, sols, murs de clôture, relief)
  instances.{hash}.bin   # listes d'instances par module de kit (façades, props, végétation) : id de module, matrice compacte, variation
  collision.{hash}.bin   # 2,5D : champ de hauteur + prismes d'obstacles + volumes d'eau (codec de @skyline/tile-format)
  meta.{hash}.json       # validé par Zod : bâtiments (id OSM, type, niveaux, usage), lieux (avec **nom affiché** issu de l'étape `naming`), sites d'action, arrêts, adresses, voisins
  nav.{hash}.bin         # graphe piéton (trottoirs, passages) pour les PNJ — à partir de J3
```

Le manifeste de release `world-manifest.{release}.json` est un **index** (clé → hashes, bbox, version de format, source OSM, licence). Il ne contient pas de géométrie. Il est découpé par niveau (`manifest.L0.json`…) dès qu'il dépasse 1 Mo.

### 10.4. Budgets d'une tuile

| Mesure | Budget L0 (moyenne / max) |
|---|---|
| Taille compressée totale (geom + instances + collision + meta) | ≤ 600 Ko / ≤ 1,5 Mo |
| Triangles rendus en LOD0 (bâti dense) | ≤ 250 k / 400 k |
| Draw calls par tuile après instanciation | ≤ 25 / 40 |
| Temps de décodage en worker (machine de référence basse) | ≤ 30 ms |
| Temps d'intégration sur le thread principal par frame | ≤ 4 ms (découpage sur plusieurs frames) |

### 10.5. Streaming côté client

1. Le **planificateur** calcule à chaque frame (en réalité à 4 Hz) l'ensemble désiré `{tuile, niveau}` : position, vitesse et cap, avec préchargement dans le sens du déplacement.
2. Il le compare à l'ensemble chargé et met en file les écarts, par **priorité** (distance pondérée par l'angle de vue).
3. Un **worker** télécharge (Cache API, puis CDN), décode (meshopt, codecs binaires) et prépare les buffers d'instances.
4. Le thread principal intègre la tuile **en tranches** (budget en ms par frame), puis fait un fondu enchaîné avec le niveau inférieur.
5. Le déchargement se fait avec hystérésis (rayon de sortie plus grand que le rayon d'entrée) et une limite de mémoire GPU par profil de qualité.
6. Les kits (modules de façade, matériaux, végétation) sont **communs à toutes les tuiles** et chargés une seule fois, ce qui rend les tuiles légères.

---

## 11. Pipeline carte OSM → tuiles

### 11.1. Exigences

- **Déterministe** : même instantané et même configuration produisent les mêmes octets (test « golden » par hash).
- **Paramétré par commune** : `tools/map-pipeline/config/yopougon.pipeline.json` (relation OSM de la limite administrative, profils de quartiers, instantané). Ajouter Attécoubé, c'est ajouter un fichier de config.
- **Incrémental** : chaque étape écrit ses sorties avec le hash de ses entrées et ne recalcule que ce qui a changé.
- **Parallèle** : découpage par tuile, avec `worker_threads`.
- **Multiplateforme** : seul osmium tourne dans Docker. Tout le reste est du Node/TS natif sous Windows et Linux.
- **Couches séparées** (ODbL, §21) : `osm-derived` (publiée sous ODbL) et `game-authored` (contenu propriétaire qui référence des identifiants OSM).

### 11.2. Étapes

| # | Étape (`src/stages/`) | Entrée → sortie | Points clés |
|---|---|---|---|
| 01 | `acquire` | `sources.lock.json` → `.osm.pbf` en cache | Instantané Geofabrik « Ivory Coast » daté ; vérification du **sha256** ; refus si le hash diffère |
| 02 | `extract` | pbf → pbf de la commune + marge de 300 m | `osmium extract` avec le polygone de la **relation administrative** de Yopougon (identifiant à confirmer au spike SP2), puis `osmium tags-filter` |
| 03 | `export` | pbf → GeoJSONSeq | `osmium export` ; MultiPolygones et relations conservés (corrige M7) |
| 04 | `normalize` | features → features normalisées | Parsing robuste des tags (`building:levels="2;3"` → 3, unités de `height`, `NaN` interdit) ; identifiants `osm:{type}/{id}` stables |
| 05 | `classify` | → catégories | Reprise et extension de la taxonomie de `GeoJSONImporter` (santé, food, finance, culte, éducation…) ; POI surfaciques inclus |
| 06 | `heights` | bâtiments → hauteur et niveaux | Heuristiques §11.3 ; graine = hash(id OSM) |
| 07 | `terrain-water` | MNT + eau + occupation du sol → champs de hauteur par tuile | MNT ouvert (Copernicus GLO-30 ou SRTM, licence à valider) ; lagune et baies en surfaces d'eau ; nivellement local des routes et des emprises |
| 08 | `roads` | voies → graphe routier et piéton | Index spatial `flatbush` : O(n log n) au lieu de O(n²) ; `oneway`, largeurs par classe, intersections, trottoirs |
| 09 | `places-sites` | POI + bâtiments + `content/place-types` → lieux et sites d'action | Couche `game-authored` : un maquis OSM devient un lieu de type `maquis`, avec tables, comptoir et intérieur |
| 09b | `naming` | lieux + `content/place-names` → nom affiché | Toponymie et lieux publics : nom réel ; marques : table de parodie revue par un humain (une marque inconnue fait échouer le build) ; autres commerces : déformation déterministe (graine = identifiant OSM, distance minimale) ; surcharges et retraits ; seule l'étape qui écrit le nom affiché (§3.4, ADR 0010) |
| 10 | `transit` | relations `route=bus` OSM + `content/transport/lines` → lignes, arrêts, gares | Couverture OSM des lignes à mesurer ; complétée par du contenu écrit à la main |
| 11 | `facades-roofs` | emprises → listes d'instances de modules + maillages de toits | §12.2 ; sélection de modules par profil de quartier + graine |
| 12 | `props-vegetation` | voies, lieux, occupation du sol → instances | Placement **perpendiculaire** à la voie (corrige m11), sans collision avec la chaussée ; densités en **mètres** |
| 13 | `collision` | → `collision.bin` par tuile | Prismes depuis les emprises, champ de hauteur, eau ; **le même fichier est lu par le client et par le serveur** |
| 14 | `tile-cut` | tout → découpage L0 | Coupe des polygones et polylignes aux bords de tuile ; un objet à cheval appartient à la tuile de son centroïde pour les métadonnées et est coupé pour la géométrie |
| 15 | `lod-build` | L0 → L1, L2, L3 | Simplification, fusion, imposteurs |
| 16 | `encode` | → glb meshopt, bin, json | Validation des budgets (§10.4) ; **échec du build** si une tuile dépasse le maximum |
| 17 | `manifest-attribution` | → manifeste, `ATTRIBUTION`, archive ODbL de la couche `osm-derived` | §21 |
| 18 | `report` | → rapport de couverture | Nombre de bâtiments, % de hauteurs OSM et % d'heuristiques, tuiles vides, avertissements |

### 11.3. Heuristiques de hauteur et de forme

Ordre de priorité : `height` → `building:levels` (+ `roof:levels`) → jeu de données ouvert de hauteurs, si sa licence est validée (§21.3) → **heuristique**.

L'heuristique combine :
- le type de bâtiment (`building=apartments` → R+3 à R+5 ; `house`/`yes` résidentiel → R+0 majoritaire ; `church`, `mosque` → volumes spécifiques ; `industrial`/`warehouse` → 7 à 12 m) ;
- l'occupation du sol englobante (`landuse=industrial` pour la zone industrielle de Yopougon, `residential`, `retail`) ;
- la géométrie de l'emprise (aire, rectangularité, allongement) : une grande emprise rectangulaire en zone résidentielle oriente vers un immeuble collectif ;
- un **profil de quartier** (`config/…pipeline.json`) : distribution de niveaux par quartier (ex. lotissements SICOGI à étages, quartiers d'habitat de cours communes à R+0 ou R+1, axes commerçants à R+1 ou R+2). La liste et les polygones des quartiers sont à valider avec le propriétaire (Niangon, Selmer, Toits-Rouges, Siporex, Wassakara, Port-Bouët 2, Andokoi, Gesco, Sicogi…) ;
- un tirage **seedé** par identifiant OSM dans la distribution du profil.

Les valeurs heuristiques sont **marquées** dans `meta` (`heightSource: "osm" | "dataset" | "heuristic"`) pour le rapport et pour d'éventuelles contributions à OSM.

---

## 12. Rendu semi-réaliste

### 12.1. Principe

À l'échelle d'une commune (environ 10⁵ bâtiments), on ne modélise pas les bâtiments un par un. On **génère** chaque bâtiment à partir de son emprise, en assemblant des **modules** d'un kit (façades, ouvertures, toitures, accessoires) habillés de matériaux PBR partagés. La crédibilité vient de la **variation** (teintes, salissures, coulures de pluie, enseignes peintes, climatiseurs, fers en attente sur les toits-terrasses, tôles ondulées, murs de clôture, portails métalliques) et de l'**éclairage**, pas de la quantité de géométrie unique.

### 12.2. Génération des façades (hors ligne, étape 11)

1. Chaque arête de l'emprise devient un **mur** ; chaque mur est découpé en **travées** de 2,5 à 4 m et chaque étage fait environ 3 m.
2. Chaque travée reçoit un module (`bld_wall_window_a`, `bld_shopfront_shutter_b`, `bld_door_metal_c`, `bld_balcony_a`…) tiré par la graine du bâtiment dans la **grammaire du profil** (habitat de cour, immeuble SICOGI, commerce sur rue, bâtiment public). Le rez-de-chaussée sur rue commerçante reçoit des devantures.
3. Les angles reçoivent des modules d'angle. Les restes de longueur deviennent des panneaux de mur étirés dans une tolérance de ±15 %.
4. Toits : **terrasse** (acrotère, cuves d'eau, fers en attente) ou **tôle** (un ou deux pans sur les emprises quasi rectangulaires). Tout le reste a un toit plat (pas de squelette droit au MVP).
5. La sortie est une **liste d'instances** `(moduleId, matrice compacte, variation : teinte, salissure, index d'enseigne)`, et non un maillage. C'est ce qui garde les tuiles légères.

### 12.3. Matériaux et textures

- **PBR métal/rugosité**. Un nombre réduit de matériaux maîtres (≤ 12 : façade, toit, sol, route, végétation, verre, métal, eau, personnage, véhicule, émissif, décalcomanies). Les variantes passent par des **tableaux de textures** (`Texture2DArray`, WebGL2) indexés par instance, et par un **plugin de matériau** Babylon (teinte, masque de salissure, usure).
- Textures en **KTX2** (ETC1S pour la couleur, UASTC pour les normales), transcodées selon le GPU. Densité de texels uniforme. 2048² au maximum (1024² au profil Bas).
- **Décalcomanies** : enseignes peintes à la main, publicités murales fictives, numéros. Ce sont des quads instanciés dans un atlas.

### 12.4. Éclairage et post-traitement

- Un soleil directionnel et un environnement IBL préfiltré (`.env`) par moment de la journée, avec interpolation sur le **cycle jour/nuit** partagé par tous (`sim-clock`).
- Ombres : cascades limitées à 120 m (Haut), une cascade à 60 m (Moyen), ombres en tache sous les personnages (Bas).
- Occlusion ambiante **précalculée** dans les modules (couleurs de sommets ou canal AO) ; SSAO au profil Haut uniquement.
- La nuit : lampadaires et enseignes en émissif, avec peu de lumières dynamiques (les plus proches seulement).
- Mappage tonal neutre PBR, FXAA, bloom léger au profil Haut.

### 12.5. Végétation, personnages, véhicules

- Végétation tropicale (manguier, cocotier, palmier, fromager, bananier, haies) : instanciée, avec 3 LOD puis des **imposteurs** octaédriques au-delà de 150 m.
- Personnages : deux corps de base sur un **squelette commun**, vêtements et coiffures modulaires (pagne, boubou, maillot, tenue de travail ; tresses, nattes, coupes), et animations reciblées. La **foule** lointaine et les PNJ d'ambiance utilisent l'animation par textures de sommets (VAT), ce qui permet des centaines de silhouettes à faible coût.
- Véhicules : taxi compteur, woro-woro, gbaka, bus SOTRA, motos, 5 ou 6 voitures personnelles fictives. Les couleurs réglementaires par commune et par mode sont à documenter par la DA.

### 12.6. Assets « héros »

Une douzaine de lieux emblématiques sont modélisés à la main et substitués au bâtiment procédural correspondant (via `content/place-types` et un identifiant OSM). Candidats à valider avec le propriétaire : la mairie, le grand marché, Rue Princesse, une ou deux gares de gbaka et de woro-woro, un terminus SOTRA, une grande église, une grande mosquée, un terrain de foot, une station-service, l'entrée d'une cour commune type, un maquis type, un cybercafé type.

### 12.7. Profils de qualité

| Profil | Cible | Rayon L0 | Ombres | Échelle de rendu | Budget triangles / draw calls | Mémoire GPU |
|---|---|---|---|---|---|---|
| **Bas** | Machine de référence basse (H5), **≥ 30 FPS** | 200 m | taches | 0,75 | ≤ 1 M / ≤ 600 | ≤ 700 Mo |
| **Moyen** | Machine moyenne (H6), ≥ 60 FPS | 300 m | 1 cascade | 1,0 | ≤ 2 M / ≤ 1 000 | ≤ 1,2 Go |
| **Haut** | GPU récent, ≥ 60 FPS | 450 m | 3 cascades + SSAO | 1,0 | ≤ 3,5 M / ≤ 1 500 | ≤ 2 Go |
| **Mobile** (préparé) | Smartphone milieu de gamme | 150 m | taches | 0,6 à 0,75 | ≤ 500 k / ≤ 300 | ≤ 400 Mo |

Le profil est détecté au premier lancement (court benchmark) et modifiable par le joueur.

### 12.8. Chiffrage honnête du coût artistique

| Lot | Contenu | Personnes-mois (art) |
|---|---|---|
| Kit de façades et toitures | 80 à 120 modules × 2 ou 3 LOD, 6 profils de grammaire | 6 à 9 |
| Matériaux et décalcomanies | 30 à 40 jeux de textures PBR, 150 décalcomanies (enseignes fictives) | 2 à 3 |
| Props urbains | 80 props (étals, parasols, tables et chaises plastiques, glacières, poteaux électriques et câbles, kiosques Mobile Money fictifs, charrettes, poubelles, bancs, panneaux) | 3 à 4 |
| Végétation | 10 espèces, LOD et imposteurs | 1 à 2 |
| Personnages | 2 corps, 40 à 60 vêtements, 12 à 15 coiffures, visages paramétriques | 4 à 6 |
| Animations | 80 à 100 clips (marche, course, assis, manger, danser, prier, se laver, dormir, conduire, jouer au foot, coiffer, cuisiner…) ; capture de mouvement sous licence compatible | 3 à 4 |
| Véhicules | 10 à 12 véhicules, intérieurs simples | 2 à 3 |
| Lieux héros et gabarits d'intérieurs | 12 lieux, 10 gabarits d'intérieur | 3 à 5 |
| **Total** | | **24 à 36 p-m** (≈ 22 à 33 si l'on achète des packs pour les props et la végétation) |

Ordre de grandeur budgétaire [H] : avec un freelance à 1 500 – 3 500 €/mois, **35 000 à 115 000 €**, plus 3 000 à 8 000 € de packs d'assets. Avec **un seul artiste à temps plein**, la production s'étale sur environ 24 mois : le MVP sort donc avec un kit « v1 » réduit (≈ 50 modules, 25 vêtements, 50 animations), complété après la bêta. **Le semi-réaliste se dégrade proprement** : chaque module manquant est remplacé par sa version grise, sans bloquer le code.

---

## 13. Simulation serveur MMO (ADR 0003)

### 13.1. Cellules et propriété

- Une **cellule** est l'unité d'autorité : toutes les entités dont la position est dans la cellule appartiennent à son serveur de zone.
- L'**annuaire** (NATS KV `directory.cells`) associe chaque `cellId` à un `zoneId` avec un **bail** renouvelé toutes les 5 s. Un bail expiré rend la cellule réattribuable. La réattribution d'une cellule active suit le protocole gel → instantané → transfert → reprise (cible : < 2 s de gel, annoncé aux joueurs).
- Au MVP, l'attribution des cellules aux processus est **statique** (configuration). Le rééquilibrage dynamique et la scission automatique des cellules chaudes sont des points d'extension, préparés mais pas activés.

### 13.2. Boucle de tick (20 Hz)

1. Lire les entrées en file par entité, dans l'ordre des numéros de séquence ; ignorer les entrées trop anciennes.
2. Appliquer le déplacement avec `@skyline/physics` (même code que la prédiction client) ; valider la vitesse, les collisions et les téléportations.
3. Avancer les **véhicules** (ligne : fonction de l'horaire ; taxi et véhicule personnel : physique arcade).
4. Avancer les **actions** en cours (machine à états de `sim-actions`) et appliquer leurs effets non économiques.
5. Avancer les **besoins** (à 1 Hz, pas à chaque tick).
6. Avancer les **PNJ fonctionnels** (vendeurs, chauffeurs).
7. Traiter les transferts sortants et entrants ; mettre à jour les **fantômes** envoyés aux cellules voisines.
8. Calculer l'**aire d'intérêt** et produire les instantanés par client (débit différencié).
9. Publier les métriques (durée du tick p50/p95/p99, entités, octets).

Budget : tick p95 ≤ 25 ms avec 150 joueurs dans une cellule (machine de bêta à 2 vCPU par processus de zone [H]).

### 13.3. Aire d'intérêt

- Hachage spatial à mailles de 32 m dans chaque cellule.
- Rayon d'intérêt : 150 m à pied, 250 m en véhicule.
- **Plafond** : 64 entités à plein débit (20 Hz), 128 à débit réduit (5 Hz), le reste n'est pas envoyé. La priorité combine distance, interaction en cours, groupe d'amis et vitesse relative.
- Les entités d'**ambiance** (foule, trafic) ne sont pas répliquées : le client les génère lui-même, de façon déterministe par graine de tuile. Seules les entités **fonctionnelles** (joueurs, véhicules de joueurs, taxis, véhicules de ligne, PNJ avec qui on interagit) le sont.

### 13.4. Frontières, fantômes et transferts

- **Fantôme** : toute entité située à moins de `R_ghost = 200 m` (≥ rayon d'intérêt maximal) d'une frontière est publiée en lecture seule aux cellules voisines à 10 Hz. La cellule propriétaire d'un joueur dispose ainsi de tout ce que ce joueur doit voir, et la passerelle n'a rien à composer.
- **Transfert** : quand une entité franchit la frontière de plus de 20 m (hystérésis contre les allers-retours), la cellule source (1) gèle ses entrées pendant au plus un tick, (2) envoie `TransferEntity{state, lastSeq, actionState}` à la cellule cible, (3) reçoit l'accusé, (4) met à jour la table de routage de la passerelle (`gw.{id}.route`), et (5) la cible devient autoritaire. **Le client ne voit rien** : sa socket ne change pas. Objectif : moins de 100 ms, sans saut visible.
- **Action à cheval sur une frontière** (deux joueurs de part et d'autre qui discutent) : l'action appartient à la cellule de l'**initiateur**. La participation de l'autre entité passe par une requête à sa cellule propriétaire, qui valide et confirme.
- **Instances** (intérieurs de logement, intérieurs de lieux) : ce sont des cellules **hors carte** (`cellId = inst:{type}:{id}`), gérées par le même mécanisme. Entrer dans une maison est un transfert.

### 13.5. Persistance depuis la simulation

| Donnée | Quand | Par qui |
|---|---|---|
| Djai, achats, salaires, loyers | **Immédiatement**, transaction idempotente | Cellule → `EconomyPort` → service Économie |
| Inventaire modifié par une action | Dans la même transaction que le paiement, si l'action paye ; sinon point de sauvegarde | Économie / Personnages |
| Position, besoins, action en cours | Point de sauvegarde toutes les 60 s, à la déconnexion et lors d'un transfert vers une instance | Cellule → `CharacterStorePort` |
| Compétences, emploi, relations | À chaque changement validé | Personnages |
| Positions des PNJ et des véhicules de ligne | Jamais (recalculées depuis l'horaire) | — |

En cas de plantage d'un processus de zone, on perd **au plus 60 s** d'état non monétaire. L'argent n'est jamais perdu, puisqu'il est écrit avant d'être affiché.

### 13.6. Déconnexion et reconnexion

Le comportement reprend le CDC §14.13 : l'avatar reste 60 s en état « déconnecté » (immobile, non interactif) ; la reconnexion se fait avec un jeton de reprise et un backoff exponentiel avec gigue ; une session perdue entraîne un rechargement depuis la base. Une seule connexion active par personnage : la nouvelle ferme l'ancienne.

---

## 14. Contrats réseau

### 14.1. HTTP (`apps/services`), REST versionné sous `/api/v1`

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/v1/auth/guest` | Crée un profil invité ; renvoie le **jeton d'appareil** (secret ≥ 128 bits, stocké côté client) qui sert aussi de **code de récupération**, + un jeton d'accès |
| POST | `/api/v1/auth/guest/session` | Ouvre une session à partir du jeton d'appareil (ou du code de récupération saisi sur un autre navigateur) ; limité en débit |
| POST | `/api/v1/auth/refresh` · `/auth/logout` | Jeton d'accès 15 min + rafraîchissement par rotation (hash stocké) |
| — | `/api/v1/auth/register`, `/auth/login`, `/auth/upgrade` | **Réservées** (point d'extension compte permanent, non implémentées au MVP) |
| GET | `/api/v1/me` | Profil, consentements |
| GET / POST | `/api/v1/properties/*` | Biens disponibles (lecture), bail, achat, vente au système (écritures idempotentes, en-tête `Idempotency-Key` obligatoire) |
| GET / POST / PATCH | `/api/v1/businesses/*` | Ouvrir un commerce, fixer les prix (dans les bornes), réapprovisionner auprès du grossiste, proposer, accepter et résilier un contrat d'emploi, consulter la caisse (`Idempotency-Key` obligatoire sur les écritures) |
| POST / GET | `/api/v1/characters` · `/characters/:id` | Création (apparence validée) / lecture |
| POST | `/api/v1/session/ticket` | **Ticket de connexion** à la passerelle (JWT 60 s, usage unique `jti`) + URL de passerelle |
| GET | `/api/v1/me/export` | Export RGPD (JSON) |
| DELETE | `/api/v1/me` | Suppression du compte (effacement différé de 30 jours, cf. §20) |
| POST | `/api/v1/reports` | Signalement d'un joueur |
| GET | `/api/v1/content/manifest` | Versions des paquets de contenu et du monde (le reste est sur le CDN) |

Erreurs : format unique `{ error: { code, message, details? } }`, codes stables en `SCREAMING_SNAKE_CASE`.

### 14.2. WebSocket (passerelle)

Poignée de main : `hello{protocolVersion, ticket, clientBuild}` → `welcome{entityId, serverTimeMs, worldClock, cellId, contentVersion, worldRelease}` ou `error{PROTOCOL_MISMATCH | TICKET_INVALID | ALREADY_CONNECTED | SERVER_FULL_REGION}`.

**Client → serveur**

| Message | Contenu | Codec / débit | Règle serveur |
|---|---|---|---|
| `input` | seq, dt, axes quantifiés (int8), yaw (uint16), drapeaux (course, saut, s'asseoir) | binaire, ≤ 30 Hz | Rejet des entrées trop anciennes, contrôle de vitesse |
| `vehicle_input` | seq, accélération, frein, direction (int8) | binaire, ≤ 30 Hz | Uniquement pour le conducteur du véhicule |
| `action_request` | `requestId` (UUID, clé d'idempotence), `actionId`, `siteId?`, `targetEntityId?`, `params?` | MessagePack + Zod | Conditions réévaluées par le serveur |
| `action_cancel` | `requestId` | idem | Règles d'interruption de la fiche |
| `interact` | `targetEntityId` | idem | Proximité |
| `transport_request` | `mode` (héler un taxi dans la rue, demander à la gare), `destinationPlaceId?`, `requestId` | idem | Disponibilité, tarif |
| `board` / `alight` | `vehicleId`, `seat?` | idem | Arrêt, proximité, place libre |
| `chat` | `channel` (**proximité uniquement** au MVP, rayon 30 m), `text` ≤ 200 caractères | idem, ≤ 1 message/s, rafale de 5 | Filtre, mise en sourdine, blocage, signalement ; aucune messagerie privée |
| `emote` | `emoteId` | idem | Liste blanche |
| `ping` | horodatage client | binaire | — |

**Serveur → client**

| Message | Contenu |
|---|---|
| `snapshot` | Base + deltas : entités entrées/sorties de l'aire d'intérêt ; position en cm relative à l'origine de la cellule (int32 → quantifié), yaw uint16, état d'animation, véhicule et siège |
| `input_ack` | Dernier `seq` traité + état autoritaire du joueur (réconciliation) |
| `action_update` | `requestId`, état (`accepted`, `running`, `progress`, `completed`, `interrupted`, `failed{reason}`), effets confirmés |
| `needs_update` | Valeurs des besoins (1 Hz si elles changent) |
| `wallet_update` | Solde confirmé + `txId` (jamais de crédit anticipé côté client) |
| `inventory_update` | Delta d'inventaire |
| `transport_update` | Proposition de taxi, ETA, arrivée, tarif débité |
| `world_clock` | Segment d'horloge courant (`segmentId`, `realEpochMs`, `gameEpochMin`, `ratio`) + `serverTimeMs`, envoyé à la connexion, toutes les 30 s et à chaque changement de segment ; le client corrige sa dérive (§16.1) et n'utilise jamais son heure locale pour une règle |
| `notification` | Messages système (clé i18n + paramètres, jamais de texte en dur), offres d'emploi, échéances de loyer |
| `error` | Code normalisé |
| `pong` | Écho |

Règles : taille maximale par message (4 Ko de contrôle, 64 Ko d'instantané) ; messages inconnus ou invalides rejetés et **comptés** (déconnexion au-delà d'un seuil) ; `protocolVersion` incrémenté à chaque changement incompatible ; tests de compatibilité dans `@skyline/protocol`.

Bande passante cible : **descendante ≤ 25 Ko/s** par joueur en zone dense, ≤ 8 Ko/s en zone calme ; **montante ≤ 4 Ko/s**.

### 14.3. Bus interne (NATS)

| Sujet | Type | Contenu |
|---|---|---|
| `cell.{cellId}.in` | pub | Entrées et commandes routées par la passerelle |
| `gw.{gatewayId}.out.{connId}` | pub | Instantanés et messages vers un client |
| `gw.{gatewayId}.route` | pub | Changement de cellule propriétaire d'une connexion |
| `cell.{cellId}.ghosts` | pub | Fantômes vers les voisins |
| `cell.{cellId}.transfer` | req/rep | Transfert d'entité |
| `svc.economy.commit` | req/rep | Opération économique idempotente |
| `svc.character.load` / `.checkpoint` | req/rep | Chargement et sauvegarde du personnage |
| `svc.property.*`, `svc.business.*`, `svc.moderation.*` | req/rep | Services métier (vérification d'accès à un logement, vente en commerce de joueur) |
| KV `world.clock` | KV | Segment d'horloge courant, publié par le module `world-clock` ; lu par toutes les zones et passerelles |
| KV `directory.cells` | KV | Propriété des cellules (baux) |

Tous les messages du bus portent une version de schéma et sont validés à la réception. NATS est authentifié (nkeys) et chiffré (TLS) hors développement local.

---

## 15. Moteur d'actions piloté par les données (ADR 0004)

### 15.1. Principe

**Une action est une fiche de données, pas du code.** Le moteur (`@skyline/sim-actions`, pur) sait évaluer des **conditions**, dérouler une **machine à états** temporelle et appliquer des **effets** au travers d'un registre extensible. Ajouter « manger un garba » revient à ajouter un fichier JSON. Ajouter un *nouveau type d'effet* (ex. `wanted_level` en v2) revient à ajouter un gestionnaire d'effet, un fichier, sans modifier le moteur.

### 15.2. Cycle de vie d'une action (serveur)

```text
requested ─► validated ─► reserved ─► running ─► completed ─► settled
    │            │            │           │                       ▲
    └─ rejected  └─ rejected  └─ timeout  ├─ interrupted ─────────┤ (règlement partiel selon la fiche)
                                          └─ failed ──────────────┘
```

- **validated** : conditions évaluées sur l'état autoritaire (lieu, horaire, besoins, argent, compétences, objets, temps de recharge, participants).
- **reserved** : place réservée sur le site (une chaise, un fauteuil de coiffure) ; **pré-autorisation** de paiement si un coût existe.
- **running** : progression par phases (entrée, boucle, sortie) ; effets « continus » (ex. +énergie par minute de jeu en dormant) appliqués à 1 Hz.
- **settled** : règlement économique **en une transaction idempotente** dont la clé est `action:{requestId}`. Un renvoi de la même demande retourne le même résultat.
- Interruptions : déplacement hors du rayon du site, déconnexion de plus de 60 s, annulation par le joueur, fermeture du lieu. La fiche définit le règlement partiel.

### 15.3. Schéma d'une fiche (exemple réel)

`content/actions/food/eat-garba.action.json`

```json
{
  "$schema": "../../../tools/content-cli/schemas/action.schema.json",
  "id": "food.eat_garba",
  "version": 1,
  "category": "food",
  "labelKey": "action.food.eat_garba.label",
  "descriptionKey": "action.food.eat_garba.desc",
  "icon": "ui_icon_garba",
  "tags": ["food", "street_food", "social_light"],

  "where": {
    "placeTypes": ["garba_stand", "maquis"],
    "site": "seat_or_counter",
    "interactionRadiusM": 2.5
  },
  "when": {
    "openingHoursFrom": "place",
    "windows": [{ "from": "06:00", "to": "23:30" }]
  },
  "requires": {
    "needs": { "hunger": { "max": 90 } },
    "money": { "minDjai": 500 },
    "state": ["on_foot", "not_in_action"],
    "cooldown": { "gameMinutes": 180, "scope": "character" }
  },
  "cost": {
    "djai": { "base": 500, "priceSource": "business_price_list_or_base", "priceModifiers": ["skill.haggling"] },
    "payee": "provider"
  },
  "duration": {
    "gameMinutes": 30,
    "real": { "maxSeconds": 45 },
    "interruptible": true,
    "onInterrupt": "refund_none_partial_effects"
  },
  "phases": [
    { "id": "order", "animation": "anm_order_counter", "realSeconds": 4 },
    { "id": "eat",   "animation": "anm_eat_seated_plate", "loop": true, "props": [{ "id": "prop_plate_garba", "attach": "hand_l" }] },
    { "id": "finish","animation": "anm_wipe_mouth", "realSeconds": 2 }
  ],
  "effects": {
    "onComplete": [
      { "type": "need", "need": "hunger", "delta": -55 },
      { "type": "need", "need": "social", "delta": 5, "if": { "nearbyCharacters": { "min": 1 } } },
      { "type": "buff", "buff": "well_fed", "gameMinutes": 240 }
    ],
    "continuous": []
  },
  "outcomes": [
    { "weight": 95, "effects": [] },
    { "weight": 5, "effects": [{ "type": "notification", "key": "action.food.eat_garba.extra_piment", "register": "nouchi" }, { "type": "need", "need": "fun", "delta": 3 }] }
  ],
  "skills": { "grant": [] },
  "participants": { "mode": "solo", "npcRoles": [{ "role": "vendor", "required": true }] },
  "provider": { "kind": "place", "allowPlayerBusiness": true, "employeeRole": "vendor" },
  "extensions": {
    "legality": "legal",
    "witnessable": false,
    "missionHooks": []
  }
}
```

Champs obligatoires : `id`, `version`, `category`, `labelKey`, `where`, `duration`, `effects`. Les durées, temps de recharge et fenêtres `when` sont en **temps de jeu** (§16.1) ; `real.maxSeconds` plafonne la durée réelle (ellipse). Si le lieu est un commerce de joueur, le prix vient de sa liste de prix (dans les bornes de `content/businesses`), le paiement crédite la **caisse du commerce**, l'article est retiré de **son stock**, et le rôle `vendor` peut être tenu par un **employé joueur** en service ; sinon, par un PNJ. Le schéma Zod est la source de vérité. Le JSON Schema en est **généré** (autocomplétion VS Code), et `content-cli` valide en CI : références d'animations, d'objets, de types de lieux, de clés i18n existantes, effets connus.

### 15.4. Registres extensibles

| Registre | Exemples au MVP | Extension v2 |
|---|---|---|
| Conditions | `need`, `money`, `skill`, `item`, `job`, `property_access` (bail ou titre), `business_role` (propriétaire, employé en service), `business_stock`, `time_window`, `cooldown`, `state`, `nearby_characters`, `vehicle`, `weather` (prévu) | `wanted_level`, `health`, `faction` |
| Effets | `need`, `money` (via Économie uniquement), `item_add/remove`, `stock_consume` (commerce), `skill_xp`, `buff`, `relationship`, `notification`, `enter_instance`, `teleport_on_transport`, `job_shift_progress`, `employment_shift_progress` | `damage`, `wanted_level`, `mission_progress` |
| Fournisseurs (`provider`) | `place` (PNJ du lieu), `system`, `job` (employeur PNJ), **`player_business`** (maquis, boutique) | autres types de commerces |
| Rôles de participants | `vendor` (PNJ ou employé joueur), `driver`, `hairdresser`, `teammate`, `partner`, `owner` | `cop`, `enemy` |

Les gestionnaires d'effets **économiques** ne modifient jamais un solde. Ils produisent des **jambes d'écriture** (débit/crédit) envoyées à l'`EconomyPort` lors du règlement.

### 15.5. Côté client

Le client charge le **catalogue d'affichage** (libellés, icônes, coûts indicatifs, conditions) pour proposer les actions disponibles près du joueur et griser les impossibles en expliquant pourquoi. C'est un **aperçu non autoritaire** : `sim-actions` est partagé, mais seul le serveur décide.

### 15.6. Catalogue cible (ivoirien, ambitieux, livré par vagues)

**Vague A** = J3 (≈ 35 actions), **Vague B** = J4 à J6 (transport, logement, commerces, économie), **Vague C** = J7 et après la bêta. Les identifiants sont indicatifs. Chaque catégorie a au moins une variante disponible **la nuit de jeu**.

| Catégorie | Actions | Lieux (types) | Vague |
|---|---|---|---|
| **Manger & boire** | Manger un garba (attiéké-thon), manger de l'alloco, du placali, du foutou sauce graine, un kédjénou, du poisson braisé ; boire un bissap, un gnamakoudji ; boire un sucré au maquis ; acheter du pain et du café chez le « boutiquier » | garba_stand, maquis, street_vendor, boutique | A |
| **Cuisiner** | Acheter des ingrédients au marché, cuisiner à la maison (attiéké, sauce), partager un repas | market, home.kitchen | B |
| **Hygiène** | Se laver (douche ou seau), se brosser les dents, faire la lessive, repasser | home.bathroom, home.yard | A |
| **Repos** | Dormir (avec ellipse, §16.1), faire la sieste, s'asseoir à l'ombre | home.bed, bench, tree_shade | A |
| **Apparence** | Se faire tresser (longue durée, en plusieurs séances), coupe chez le barbier, manucure, acheter des vêtements à la friperie, faire coudre une tenue chez le couturier, changer de tenue | hair_salon, barber, market.clothes, tailor, home.wardrobe | A/B |
| **Travail** (§16.3) | Prendre son service, travailler (boucle de mini-interactions), se faire payer ; métiers : vendeuse d'attiéké, serveur de maquis, coiffeuse, barbier, gérant de cybercafé, gérant de kiosque Mobile Money, couturier, mécanicien, livreur à moto, chauffeur de woro-woro, apprenti gbaka (« balanceur »), aide-maçon, vigile, commerçant au marché | divers | A (5 métiers) / B |
| **Argent** | Consulter son solde (HUD), déposer et retirer en agence, envoyer des Djai à un joueur par son pseudonyme au kiosque Mobile Money fictif (plafonné), recevoir son salaire, payer son loyer d'avance, épargner | bank, mobile_money_kiosk | B |
| **Gérer un commerce** (§16.5) | Ouvrir un maquis ou une boutique (local loué ou acheté), réapprovisionner chez le grossiste, fixer les prix, ouvrir et fermer, tenir le comptoir, embaucher un joueur, payer les salaires, encaisser | business_premises, wholesaler | B |
| **Travailler pour un joueur** | Accepter une offre d'emploi, prendre son service au commerce, servir les clients (rôle `vendor`), être payé à la fin du service | business_premises | B |
| **Social** | Saluer, discuter (chat de proximité entre joueurs, dialogue court avec un PNJ en français et en nouchi), offrir un verre, s'asseoir ensemble, rejoindre un grin de thé | partout, maquis, grin | A |
| **Fête & musique** | Danser (coupé-décalé, zouglou : émotes animées), faire la fête au maquis le soir, ambiancer (DJ), organiser une fête chez soi (v. après la bêta) | maquis, rue_princesse, home | A/C |
| **Sport & jeux** | Foot de quartier (maracana, multijoueur 2 à 10), jouer au damier, au ludo, à l'awalé (mini-jeux, après la bêta), faire son footing | football_ground, grin, street | A (foot simplifié) / C |
| **Culte** | Prier à l'église, prier à la mosquée (horaires de prière), assister à un office ; lieux marqués **sanctuaire** (aucune action « illégale » possible, même en v2) | church, mosque | A |
| **Loisirs** | Aller au cybercafé (naviguer : mini-UI), regarder un match au maquis, écouter la radio, se promener (réduit le stress) | cybercafe, maquis, street | A/B |
| **Logement** (§16.4) | Visiter, louer une chambre en cour commune, un studio ou un appartement ; payer la caution ; acheter une maison ; inviter quelqu'un ; décorer (après la bêta) | housing | B |
| **Transport** (§17) | Héler un taxi dans la rue ou à une station, prendre un woro-woro à la gare, monter dans un gbaka, attendre le bus SOTRA, acheter un ticket, conduire sa moto ou sa voiture, faire le plein, réparer au garage, se garer | stops, stations, garage | B |
| **Achats** | Acheter au marché (marchandage : compétence), à la boutique de quartier, à la pharmacie (médicaments fictifs : besoin d'énergie ou d'hygiène), à la quincaillerie | market, boutique, pharmacy | A/B |
| **Études** (après la bêta) | Suivre un cours du soir (compétence), réviser au cybercafé | school, cybercafe | C |

Contenu sensible à trancher (Q5) : la **bière au maquis** (alcool, classification d'âge) ; les marques de boissons sont de toute façon parodiées (ADR 0010).

---

## 16. Besoins, temps de jeu, métiers, logement

### 16.1. Horloge interne du monde (ADR 0011)

**Modèle** : le temps de jeu est une **fonction pure** du temps serveur, définie par un **segment d'horloge** :

```ts
interface ClockSegment {            // publié dans content/game-config/clock.json + annuaire NATS KV "world.clock"
  segmentId: number;                // incrémenté à chaque changement de ratio ou à chaque pause
  realEpochMs: number;              // instant réel (horloge serveur NTP) de début du segment
  gameEpochMin: number;             // minute de jeu absolue au début du segment
  ratio: number;                    // minutes de jeu par minute réelle ; 12 par défaut ; 0 = monde en pause (maintenance)
}
// gameMinute(nowRealMs) = gameEpochMin + (nowRealMs - realEpochMs) / 60000 * ratio
```

- **Autorité** : le service `world-clock` (module de `apps/services`) est la **seule** source des segments. Il les persiste en base (`world_clock_segment`) et les publie dans NATS KV `world.clock`. Changer le ratio ou mettre le monde en pause crée un **nouveau segment** qui démarre à la minute de jeu courante : le temps de jeu reste **continu et monotone**, sans saut.
- **Même horloge pour tous les serveurs de zone** : chaque zone lit le segment courant (abonnement KV) et calcule `gameMinute` à partir de son horloge système **synchronisée par NTP** (exigence d'exploitation : dérive < 50 ms, vérifiée par une métrique et une alerte). Deux zones calculent donc la même heure de jeu à quelques dixièmes de minute de jeu près ; les décisions sensibles à une frontière de temps (ouverture d'un lieu, échéance) sont prises par la cellule propriétaire, ou par le service concerné pour les échéances. En mode `all-in-one`, la même fonction tourne en mémoire.
- **Diffusion aux clients avec correction de dérive** : à la connexion, puis toutes les 30 s, la passerelle envoie `world_clock{segment, serverTimeMs}`. Le client estime son **décalage avec l'horloge serveur** à la manière de NTP (échanges `ping`/`pong`, médiane des 8 derniers échantillons, rejet des RTT aberrants) et calcule localement `gameMinute`. Il **lisse** les corrections (au plus 1 % d'accélération ou de ralentissement de l'affichage) pour éviter les sauts du soleil, et applique une correction franche au-delà de 5 minutes de jeu d'écart. Le client n'utilise **jamais** son heure locale pour une règle : l'heure affichée et le cycle jour/nuit sont cosmétiques, le serveur décide.
- **Calendrier** (`content/game-config/calendar.json`) : 24 h par jour, **7 jours par semaine** (lundi → dimanche, noms localisés), **4 semaines par mois** (28 jours), **12 mois par an** ; jour 0 = lundi 1er janvier an 1. Avec le facteur 12 : 1 jour de jeu = 2 h réelles, 1 semaine = 14 h, 1 mois = 2,3 jours réels environ. `sim-clock` fournit `toCalendar(gameMinute)`, les fenêtres horaires et les échéances (« prochain lundi 06:00 »).
- **Ce qui s'exprime en temps de jeu** : cycle jour/nuit et éclairage ; horaires d'ouverture des lieux (`content/place-types`) ; créneaux de travail ; fréquences des transports ; décroissance des besoins ; durées et temps de recharge des actions ; échéances des loyers ; salaires des PNJ gérants ; plafonds économiques « par jour de jeu ».
- **Ellipse des actions longues** : une durée d'action est exprimée en minutes de jeu (`duration.gameMinutes`) avec un **plafond réel** (`duration.real.maxSeconds`). Dormir 8 h de jeu (40 min réelles au facteur 12) est compressé à environ 3 min réelles : les effets de la durée de jeu complète s'appliquent, le personnage est « occupé » pendant le temps réel plafonné, et le monde continue à son rythme.
- **Plages d'ouverture larges** : la plupart des lieux sont ouverts de 06:00 à 23:00 en temps de jeu ; maquis, boutiques de nuit, pharmacies de garde et gares sont ouverts 24 h/24. Comme un cycle dure 2 h réelles, un lieu fermé rouvre rapidement.

**Règle hors connexion proposée** (à valider, Q14) :

| Élément | Pendant la déconnexion | Justification |
|---|---|---|
| **Besoins** | **Gelés** | Aucun joueur ne doit revenir affamé ou épuisé : pas de punition pour l'absence |
| **Personnage** | Retiré du monde (après 60 s de grâce) ; réapparaît au même endroit ou chez lui | — |
| **Loyers** | **Courent en temps de jeu**, prélevés automatiquement sur le solde ou sur l'avance payée | Cohérence du monde partagé |
| **Fin de bail pour impayé** | Seulement après un **préavis exprimé en temps réel** (7 jours réels) **et** au moins 2 échéances impayées ; notification à la reconnexion | Protéger le joueur occasionnel du facteur 12 |
| **Biens achetés** | Jamais perdus | — |
| **Salaires (emplois PNJ ou joueurs)** | Uniquement pour un service **effectivement travaillé** ; aucun revenu passif hors ligne | Anti-farm, simplicité |
| **Commerce de joueur** | Ouvert seulement s'il est tenu (propriétaire, employé en service ou PNJ gérant). Le PNJ gérant est payé **par heure de jeu d'ouverture** depuis la caisse ; le commerce **ferme automatiquement** quand la caisse ne couvre plus la prochaine heure. Pas de ventes simulées sans clients réels | Pas d'économie fantôme, pas de caisse vidée en silence |

**Garde-fou économique** : les prélèvements récurrents (loyers, PNJ gérants) sont exécutés par le service concerné à chaque échéance de jeu, de façon idempotente (`rent:{leaseId}:{gameWeek}`, `npc_wage:{businessId}:{gameHour}`), et rattrapés au redémarrage pour les échéances passées. Le monde ne dépend jamais de la présence d'un joueur pour avancer.

### 16.2. Besoins

`faim`, `énergie`, `hygiène`, `social`, `divertissement`, sur une échelle de 0 à 100, avec des taux de décroissance **par heure de jeu** pendant la connexion (gelés hors ligne), réglés dans `content/needs/needs.config.json`. Ils sont calibrés pour qu'une journée de jeu (2 h réelles) demande environ deux repas, une toilette et une nuit de sommeil. Un besoin à 0 applique des malus (marche ralentie, actions de travail refusées). Il n'y a pas de mort au MVP. Le **moral** est un indicateur dérivé, non stocké.

### 16.3. Métiers (employeurs PNJ)

`content/jobs/<id>.job.json` : employeur (type de lieu), créneaux de service en heures de jeu (jour et nuit), actions de travail (référence aux fiches), salaire par service, grille de progression (niveaux, compétences requises), plafond de services payés **par jour de jeu** (anti-farm). Un service dure de 4 à 8 h de jeu, compressées par l'ellipse en 8 à 15 min réelles de jeu actif. Le salaire est versé au **règlement** de l'action de service, depuis le compte système `system:wages` (§18). Les métiers de transport (chauffeur de woro-woro, apprenti gbaka) utilisent les lignes réelles (§17). Les emplois chez un **commerce de joueur** sont traités en §16.5.

### 16.4. Propriété immobilière : louer et acheter

- Les **biens** sont dérivés des bâtiments OSM (identifiant OSM + numéro d'unité) selon les règles de `content/housing/` : chambre en cour commune, studio, appartement, villa et **local commercial** (rez-de-chaussée sur rue, bâtiments `retail`/`commercial`). Prix et loyers de référence dépendent du type, de la surface et du quartier.
- **Location** : bail entre le joueur et le **bailleur système** au MVP. Caution + loyer **hebdomadaire en temps de jeu** (une semaine de jeu = 14 h réelles au facteur 12), payable **d'avance** sur 1 à 8 semaines de jeu ; prélèvement automatique et idempotent (`rent:{leaseId}:{gameWeek}`) sur l'avance puis sur le solde, y compris hors connexion ; fin du bail pour impayé seulement selon la règle hors ligne de §16.1 (préavis de 7 jours **réels** et 2 échéances impayées). Pas de saisie d'objets : l'inventaire du logement est rendu au joueur.
- **Achat** : **titre de propriété** (`property_title`), créé dans une transaction atomique unique qui débite l'acheteur, crédite `system:property`, crée le titre et clôt un éventuel bail en cours sur ce bien. Un bien acheté n'est **jamais perdu**. Il peut être **revendu** au système à un prix décoté (puits monétaire). La vente et la location **entre joueurs** sont des points d'extension [v2] : le modèle `lease` a déjà un `lessor` générique.
- **Unicité** : un bien a au plus un titre et au plus un bail actif (contraintes en base).
- L'intérieur est une **instance** (§13.4) générée depuis un gabarit (`content/interiors/`) : lit, douche et cuisine sont les sites des actions « dormir », « se laver » et « cuisiner ». Seuls le locataire, le propriétaire et leurs invités présents peuvent y entrer (condition `property_access`).
- Le joueur sans logement dort sur un banc ou à l'auberge (actions moins efficaces).

### 16.5. Commerces de joueurs (maquis, boutique)

| Élément | Règle MVP |
|---|---|
| **Ouverture** | Le joueur détient un **local commercial** (titre ou bail). Il choisit un type (`maquis` ou `boutique`, cf. `content/businesses/`) et un nom, modéré (liste noire, signalement) et qui ne peut jamais être une marque. Des frais d'ouverture s'appliquent (puits). Un compte du grand livre `business:{id}`, la **caisse**, est créé |
| **Stock** | Articles autorisés par le type (`content/businesses/maquis.business.json` : plats, boissons…). Réapprovisionnement **uniquement auprès du grossiste système** (`system:wholesale`), par une transaction atomique « débit de la caisse + ajout au stock ». Stock entier ≥ 0 (contrainte en base) |
| **Prix** | Fixés par le propriétaire **dans une fourchette** par article (`minDjai`, `maxDjai`), ce qui empêche les prix abusifs et le blanchiment par prix extrêmes |
| **Vente** | Un client lance l'action correspondante (ex. `food.eat_garba`) sur le site du commerce. Au règlement, **une seule transaction** débite le client, crédite la caisse et décrémente le stock. Sans stock, l'action est refusée avec la raison. Le commerce doit être **ouvert** (horaires choisis par le propriétaire) et tenu : par le propriétaire, par un **employé joueur en service**, ou par un **PNJ gérant**, payé par heure de jeu d'ouverture depuis la caisse, avec fermeture automatique quand la caisse ne suffit plus (§16.1), pour que le commerce vive même quand son propriétaire est hors ligne |
| **Emploi** | **Contrat d'emploi** (`employment_contract`) : poste (serveur, vendeur), salaire par service, créneaux. L'offre exige l'acceptation explicite de l'employé, physiquement présent au commerce. Au début d'un service, le salaire est **mis sous séquestre** depuis la caisse (`escrow`). À la fin du service, validée par le serveur (durée minimale de présence et d'activité), il est versé à l'employé ; en cas d'abandon, il revient à la caisse. Chaque partie peut résilier, sans pénalité au MVP |
| **Retrait** | Le propriétaire retire des Djai de la caisse vers son compte (transaction idempotente), dans la limite de plafonds anti-abus |
| **Fermeture** | Le stock est revendu au grossiste avec une décote, la caisse est versée au propriétaire, les contrats sont résiliés |
| **Anti-abus** | Plafonds de salaires et de retraits par jour ; interdiction de s'employer soi-même ou d'employer un profil de moins de 7 jours ; détection des boucles d'argent (A emploie B qui emploie A) ; journal complet |

Toutes les écritures passent par `EconomyPort.commit`, avec des jambes multiples, et les opérations de stock se font **dans la même transaction PostgreSQL** : le module `business` appelle `economy` en interne, dans le même processus de services.

---

## 17. Système de transport

### 17.1. Modes

| Mode | Modèle | Autorité | Paiement |
|---|---|---|---|
| **Marche** | Contrôleur 2,5D (`physics`) | Prédiction client + validation serveur | — |
| **Taxi compteur** | Héler un taxi dans la rue (geste) ou en prendre un à une station → taxi PNJ affecté depuis une flotte virtuelle → trajet calculé sur le graphe routier → course | Serveur (véhicule PNJ) | Au compteur : prise en charge + distance, débité à l'arrivée (`fare:{rideId}`) |
| **Woro-woro** | Taxi collectif communal : **corridors** entre gares de woro-woro, départ quand il y a assez de passagers ou après un délai maximal | Serveur | Forfait par segment |
| **Gbaka** | Minibus sur **lignes** depuis les gares, apprenti PNJ qui annonce les destinations | Serveur (horaire déterministe + attente en gare) | Forfait |
| **Bus SOTRA** | **Lignes numérotées** et arrêts ; fréquence par période de la journée | Horaire **déterministe** : position = f(ligne, horloge) | Ticket (objet) ou paiement à la montée |
| **Moto / voiture personnelle** | Achat (concession), carburant, entretien ; conduite arcade (`physics/vehicle`) | Prédiction client + serveur autoritaire | Achat, carburant, réparations |
| **Bateau-bus lagunaire** | [v2] selon les gares présentes en bordure de commune | — | — |
| **Avion** | [v2] aéroport de Port-Bouët, avec l'extension à Abidjan | — | — |

### 17.2. Données

- **osm-derived** : graphe routier (`roads`), arrêts et éventuelles relations `route=bus` (couverture à mesurer, SP2).
- **game-authored** : `content/transport/lines/<id>.line.json` (mode, arrêts par identifiant, fréquence par période, temps d'arrêt, tarif, livrée du véhicule) et `content/transport/fares/<mode>.fare.json`.

### 17.3. Simulation

- **Véhicules de ligne déterministes** : la position d'un bus est une fonction pure de `(ligne, numéro de service, horloge)`, calculée par `sim-transport` sur le client comme sur le serveur. Il n'y a **rien à répliquer** tant que le véhicule respecte l'horaire, ce qui fait une économie majeure de bande passante. Le serveur n'envoie que les écarts (embarquement en cours, incident).
- **Embarquement** : `board` est accepté si le véhicule est à quai au même arrêt et s'il reste une place. Le joueur devient passager (entité attachée à un siège). Les entrées de déplacement sont ignorées et la caméra passe en mode passager.
- **Voyage accéléré** : pendant un trajet long, le joueur peut choisir « somnoler jusqu'à mon arrêt ». Il est retiré du véhicule et réapparaît à l'arrêt choisi après un délai court, une fois le tarif payé. Le monde partagé n'est pas accéléré, seul son trajet l'est.
- **Routage** : A* sur le graphe routier (avec heuristique ALT si besoin), dans `sim-transport`. Le graphe de toute la commune est chargé en mémoire côté serveur (quelques Mo) ; le client ne charge que le graphe des tuiles proches, plus un graphe simplifié global pour la carte et le GPS.
- **Trafic d'ambiance** : voitures PNJ générées et simulées **côté client uniquement**, de façon déterministe par tuile. Elles cèdent le passage aux joueurs et ne bloquent jamais un véhicule de joueur. En v2 (police, poursuites), le trafic devra être synchronisé : c'est un point d'extension documenté.

---

## 18. Économie (Djai)

- **Grand livre en partie double** : chaque opération est une transaction composée de **jambes** dont la somme vaut zéro. Les comptes appartiennent à des personnages, à des **commerces de joueurs** (`business:{id}`, la caisse), à des **séquestres** (`escrow:{contractId}:{shiftId}`) ou au **système** (sources : `system:wages`, `system:starter_grant` ; puits : `system:shops`, `system:transport`, `system:property`, `system:wholesale`, `system:fees`).
- Les montants sont des **entiers** (Djai sans décimales, `bigint` en base). Le solde est **dénormalisé** dans le compte, mis à jour dans la même transaction, avec la contrainte `CHECK (balance >= 0)` pour les comptes de personnages.
- **Idempotence** : `idempotency_key` unique. Un rejeu renvoie le résultat d'origine (même `txId`, même solde) sans le rejouer. Les clés sont dérivées de l'intention : `action:{requestId}`, `rent:{leaseId}:{period}`, `fare:{rideId}`, `transfer:{requestId}`.
- **Contrat `EconomyPort.commit`** :

```ts
interface EconomyCommitRequest {
  idempotencyKey: string;          // ex. "action:7f9c…"
  kind: 'purchase' | 'wage' | 'rent' | 'fare' | 'transfer' | 'grant'
      | 'property_buy' | 'property_sell' | 'business_restock' | 'business_sale'
      | 'escrow_hold' | 'escrow_release' | 'escrow_refund' | 'cash_withdrawal';
  stockOps?: ReadonlyArray<{ businessId: string; itemDefId: string; delta: number }>; // appliquées dans la même transaction
  legs: ReadonlyArray<{ account: LedgerAccountRef; amount: bigint }>; // somme = 0
  reason: { actionId?: string; placeId?: string; requestId: string };
}
type EconomyCommitResult =
  | { ok: true; txId: string; balances: Record<string, bigint>; replayed: boolean }
  | { ok: false; code: 'INSUFFICIENT_FUNDS' | 'OUT_OF_STOCK' | 'PRICE_OUT_OF_BOUNDS' | 'LIMIT_EXCEEDED' | 'ACCOUNT_FROZEN' | 'INVALID_LEGS' };
```

- **Plafonds anti-abus** (par **jour de jeu**, et par jour réel pour les transferts entre joueurs) : gains de salaire, transferts entre joueurs (§3.5), retraits de caisse et salaires versés par un commerce (§16.5), achats immobiliers par semaine de jeu.
- **Pilotage** : métriques quotidiennes de masse monétaire, de sources et de puits, pour équilibrer et éviter l'inflation.
- **Jamais côté client** : le client affiche `wallet_update` et ne crédite ni ne débite rien par anticipation.

---

## 19. Modèle de données (haut niveau)

Le contenu (fiches d'actions, objets, métiers) **n'est pas en base**. La base référence les identifiants de contenu (`text`) et la version du contenu.

| Domaine | Tables | Points clés |
|---|---|---|
| Comptes | `account` (id, kind `guest` au MVP — `registered` réservé à l'extension, created_at, last_seen_at, deleted_at), `guest_credential` (account_id, **hash** du jeton d'appareil / code de récupération, created_at, rotated_at), `auth_session` (refresh_hash, expires_at, user_agent tronqué), `consent` (type, version, given_at, withdrawn_at). Les colonnes d'identifiants permanents (e-mail, hash de mot de passe) ne sont **pas créées** au MVP : elles arriveront par migration avec l'extension | Aucune donnée d'identité au MVP ; aucun secret en clair |
| Personnages | `character` (id, account_id, display_name unique, appearance JSONB validé, created_at), `character_state` (position cellule/tuile/coordonnées, besoins JSONB, action en cours, `version` pour la concurrence optimiste, checkpoint_at) | Un personnage par compte au MVP (contrainte levable) |
| Compétences | `character_skill` (character_id, skill_id, xp) | — |
| Inventaire | `inventory_item` (owner_character_id, item_def_id, quantity ≥ 0, instance_data JSONB) | Unicité (owner, item_def_id) pour les objets empilables |
| Économie | `ledger_account` (id, owner_kind, owner_id, balance bigint, frozen), `ledger_transaction` (id, idempotency_key **unique**, kind, reason JSONB, created_at), `ledger_entry` (tx_id, account_id, amount) | Source unique du solde (corrige le double solde de M4) |
| Propriété | `property` (id, osm_ref, unit_no, kind `housing`/`commercial`, housing_type, ref_rent, ref_price), `lease` (property_id, lessor_kind `system` au MVP, lessee_character_id, deposit, paid_until, status), `property_title` (property_id **unique**, owner_character_id, acquired_tx_id, acquired_at) | Au plus un titre par bien ; au plus un bail actif par bien (index unique partiel) |
| Commerces | `business` (id, owner_character_id, premises_property_id **unique**, type `maquis`/`boutique`, display_name modéré, status, opening_hours, ledger_account_id), `business_stock` (business_id, item_def_id, quantity **≥ 0**), `business_price` (business_id, item_def_id, price_djai, vérifié dans les bornes du contenu), `employment_contract` (business_id, employee_character_id, role, wage_per_shift, status, offered_at, accepted_at, ended_at), `business_shift` (contract_id, started_at, ended_at, escrow_tx_id, release_tx_id, outcome) | Stock et prix modifiés uniquement par des transactions idempotentes ; un employé ne peut pas être le propriétaire |
| Emploi PNJ | `employment` (character_id, job_id, rank, since), `shift_log` (character_id, job_id, game_day, paid_tx_id) | Plafond quotidien |
| Social | `block` (owner, blocked), `mute` (owner, muted) | Pas de liste de contacts au MVP (pas de téléphone) |
| Modération | `report`, `sanction` (type, until, reason), `chat_excerpt` (lié à un signalement, rétention courte), `place_name_takedown` (osm_ref, demandeur anonymisé, motif, statut, traité_le) | Retraits de noms réels (ADR 0010) |
| Audit | `audit_event` (actor, action, target, at, metadata sans données personnelles) | — |
| Monde | `world_clock_segment` (segment_id, real_epoch_ms, game_epoch_min, ratio, created_by, created_at) | Segments append-only ; le temps de jeu est continu et monotone |
| Vie privée | `privacy_request` (export/suppression, état, échéance) | — |
| [v2] | `mission_progress`, `wanted_state`, identifiants de compte permanent, baux entre joueurs | Non créées au MVP |

Migrations versionnées (Prisma Migrate) ; toute migration exige l'accord du propriétaire (CLAUDE.md).

---

## 20. Comptes, sécurité, RGPD, loi ivoirienne 2013-450

### 20.1. Comptes

**Invité uniquement au MVP** (décision du propriétaire). Au premier lancement, le client appelle `POST /auth/guest` : le serveur crée le profil et renvoie un **jeton d'appareil** (≥ 128 bits, stocké **haché** côté serveur, conservé dans le stockage local du navigateur). Ce jeton est aussi affiché comme **code de récupération** (format lisible par groupes, copiable), à la création puis dans les paramètres : il permet de restaurer le profil sur un autre navigateur (`POST /auth/guest/session`, limité en débit, avec verrouillage progressif contre la force brute). Le joueur peut **régénérer** son code (l'ancien est révoqué). L'interface explique clairement qu'un code perdu signifie un profil perdu.

**Point d'extension compte permanent (non construit)** : `account.kind` prévoit `registered` ; les routes `/auth/register`, `/auth/login` et `/auth/upgrade` sont réservées ; le module `accounts` expose une interface `CredentialProvider` (implémentation unique au MVP : `DeviceTokenProvider`) à laquelle s'ajouteront e-mail/mot de passe (argon2id) ou OAuth, sans toucher aux autres modules, qui ne connaissent que `accountId`.

### 20.2. Sécurité applicative

- TLS partout (HTTPS/WSS) hors local ; CSP stricte sur le client (aucun script inline, `connect-src` limité à l'API, à la passerelle et au CDN) ; CORS restreint.
- Jetons : accès en JWT 15 min (clé asymétrique, rotation), rafraîchissement opaque avec rotation et détection de réutilisation, ticket de passerelle de 60 s à usage unique.
- Validation : Zod à chaque frontière (HTTP, bus, contenu), codecs binaires **bornés** (longueurs et plages vérifiées), tests de fuzz.
- Anti-triche : vitesse et téléportation, collisions, proximité des sites, conditions d'action, cadence des requêtes, temps de recharge, plafonds économiques. Un signal isolé ne bannit jamais (CDC §14.14).
- Limitation de débit : par connexion (passerelle), par IP et par profil (API) ; création de profils invités limitée par IP (anti-ferme de comptes) ; restauration par code limitée et verrouillée progressivement.
- Moindre privilège : rôle PostgreSQL distinct par module de services (ex. seul le rôle `economy` écrit dans `ledger_*`) ; NATS avec permissions par sujet ; secrets uniquement en variables d'environnement.
- Dépendances : audit en CI, versions figées par lockfile, licences contrôlées.
- Chat (**texte de proximité uniquement**) : filtre de mots (liste en français et en nouchi, maintenue par la modération), masquage des numéros de téléphone et des liens (protection des mineurs, arnaques), signalement, sourdine, blocage, limitation de débit (1 message/s, rafale de 5) ; extraits conservés uniquement en cas de signalement.

### 20.3. Données personnelles

- **Minimisation** : au MVP, **aucune donnée d'identité** : pseudonyme, apparence, données de jeu, hash du jeton d'appareil. Ni e-mail, ni nom réel, ni téléphone, ni géolocalisation réelle. Les IP ne servent qu'à la limitation de débit et à la sécurité : jamais en clair dans les logs (hash tronqué), conservées 30 jours au maximum. Le pseudonyme et les messages de chat restent des données personnelles au sens de la loi et du RGPD.
- **Droits** : export JSON (`/me/export`), suppression (`DELETE /me`) avec délai de rétractation de 30 jours, puis anonymisation (le grand livre garde les transactions avec un identifiant anonyme, pour l'intégrité économique) ; rectification par l'interface.
- **Loi n° 2013-450 du 19 juin 2013** (Côte d'Ivoire) : l'autorité de contrôle est l'**ARTCI**. Il faut prévoir une **formalité préalable** auprès de l'ARTCI (déclaration ou autorisation selon le traitement), l'information des personnes, le consentement, les droits d'accès, de rectification et d'opposition, la sécurité des données, et **l'encadrement des transferts hors de Côte d'Ivoire** : héberger en Europe constitue un transfert, soumis à des conditions et à une autorisation. **Point à faire valider par un juriste avant la bêta publique** (Q7). Ce document n'est pas un avis juridique.
- **RGPD** : il s'applique si l'on vise des joueurs dans l'UE (diaspora). Les mesures ci-dessus (minimisation, droits, base légale, registre des traitements, sous-traitants) y répondent. Il faut aussi des CGU et une politique de confidentialité en français.
- **Mineurs** : âge minimum à fixer (Q6). Il conditionne le chat, le contenu (alcool) et le consentement parental.
- **Télémétrie client** (FPS, matériel, temps de chargement) : anonyme, agrégée, **avec consentement** si elle n'est pas strictement nécessaire.

---

## 21. Licence ODbL et données tierces (ADR 0006)

### 21.1. Obligations

- **Attribution** visible : « © les contributeurs d'OpenStreetMap », avec un lien vers `https://www.openstreetmap.org/copyright`, sur l'écran de chargement, dans les crédits, sur la carte en jeu et dans `ATTRIBUTION.md`. Le client ne peut pas être livré sans (règle non négociable).
- **Partage à l'identique** : nos tuiles (géométrie, hauteurs heuristiques, graphe routier) constituent une **base de données dérivée** d'OSM, et le jeu, un **produit dérivé** utilisé publiquement. À chaque release publique, nous **publions la couche `osm-derived` sous ODbL** (archive téléchargeable + description du pipeline). C'est l'option la plus simple et la plus sûre.

### 21.2. Séparation des couches

| Couche | Contenu | Licence |
|---|---|---|
| `osm-derived` | Emprises, hauteurs (dont heuristiques), routes, graphe, eau, POI, arrêts, sites géométriques dérivés | **ODbL** (publiée) |
| `game-authored` | `content/**` (fiches d'actions, métiers, lignes, prix, gabarits), noms fictifs générés, assets 3D | Propriétaire |
| Assets 3D | Kits, personnages, véhicules | Propriétaire / licences des packs |

Les deux couches ne sont **jamais fusionnées dans une même table de données** : le contenu de jeu **référence** des identifiants OSM sans les copier. Une base de données « collective » (ensembles indépendants) n'est pas contaminée par le partage à l'identique, à condition de rester séparée. La validation juridique de ce montage est à demander (Q8).

### 21.3. Autres sources (à valider une par une)

| Source | Usage | Licence (à vérifier avant usage) |
|---|---|---|
| MNT Copernicus GLO-30 ou SRTM | Relief | Licences ouvertes avec attribution |
| Jeux d'emprises ou de hauteurs issus d'imagerie (ex. Google Open Buildings, Microsoft Building Footprints) | Combler les trous d'OSM, hauteurs | CC BY 4.0 ou ODbL selon le jeu ; **les mélanger aux données OSM a des conséquences de licence** |

Toute nouvelle source est déclarée dans `data/sources/sources.lock.json` et dans `ATTRIBUTION.md`, avec sa licence.

---

## 22. Observabilité

| Signal | Outil | Exemples |
|---|---|---|
| Logs | pino (JSON), corrélés par `traceId` | Connexions, erreurs, transactions économiques (ids seulement), transferts de cellule. **Ni secrets, ni e-mails, ni IP en clair** |
| Métriques serveur | OpenTelemetry → Prometheus | Tick p50/p95/p99 par cellule, entités par cellule, octets entrants et sortants par client, transferts par seconde et leur durée, messages rejetés, latence de `economy.commit`, masse monétaire, sessions actives |
| Traces | OpenTelemetry | Requêtes HTTP, `economy.commit`, transferts |
| Métriques client (avec consentement) | Point d'API d'agrégation | Distribution des FPS par profil, temps de premier rendu, temps de chargement des tuiles, saccades > 50 ms, RTT |
| Tableaux de bord et alertes | Grafana (fichiers dans `infra/observability/`) | Tick p95 > 40 ms, taux d'erreur économique > 0,1 %, file sortante saturée |
| Horloge | Métrique | Dérive NTP de chaque processus (alerte > 50 ms), segment d'horloge courant par processus (alerte si divergence) |
| Santé | `/health` (vivant) et `/ready` (dépendances) sur chaque app | — |

---

## 23. Tests et qualité

| Niveau | Cible | Outil |
|---|---|---|
| Unitaires purs | `geo`, `physics`, `sim-*`, `protocol`, `tile-format`, `economy-rules` : couverture de lignes ≥ 85 % | Vitest |
| Propriétés | Aller-retour de projection (< 1 cm), codecs (décoder(encoder(x)) = x, entrée aléatoire jamais en crash), invariants du grand livre (somme nulle, solde ≥ 0, idempotence sous concurrence) | fast-check |
| Pipeline | Test **golden** : extrait OSM de référence (`export.geojson` actuel et un petit pbf) → hash des tuiles stable ; tests unitaires par étape | Vitest |
| Contenu | `content-cli validate` en CI : schémas, références croisées, i18n | content-cli |
| Intégration | Mode all-in-one : connexion → déplacement → action payante → reconnexion → solde inchangé ; transfert de cellule ; idempotence avec le même `requestId` | Vitest + PostgreSQL (Docker) |
| E2E client | Démarrage, chargement d'un quartier, déplacement, menu d'actions | Playwright |
| Performance client | Parcours de caméra scripté sur un quartier dense, sur les machines de référence ; FPS p5 et médian, temps de premier rendu, mémoire | harness `apps/web/src/debug` + rapport |
| Charge | Essaims de bots : 1 000 répartis, 150 dans une cellule, traversées de frontières, réseau dégradé | `tools/bots` |
| Sécurité | Messages invalides, rejeu, vitesse impossible, actions hors site, double dépense concurrente | intégration + fuzz |

Ces seuils s'ajoutent à la Definition of Done de CLAUDE.md. Une PR qui touche à `economy` ou à `protocol` sans test est refusée.

---

## 24. Plateforme : PC d'abord, prêt pour le mobile

- **Entrées abstraites** : clavier, souris et manette produisent des `InputIntent` (déplacement, regard, interagir, menu). Le tactile s'ajoutera comme une source de plus, sans toucher au gameplay.
- **UI responsive** en HTML/CSS (Preact), cibles cliquables ≥ 44 px, aucune dépendance au survol pour une fonction essentielle.
- **Profil Mobile** déjà défini (§12.7) ; KTX2 transcodé en ASTC/ETC2 ; budgets mémoire stricts.
- **Réseau mobile** : protocole compact, reprise de session, tolérance à la gigue ; les tuiles sont mises en cache (Cache API et service worker).
- **PWA** installable après la bêta.

---

## 25. Points d'extension v2 (prévus, non construits)

| v2 | Point d'extension déjà présent |
|---|---|
| Combat | Registres d'effets et de conditions (`damage`, `health`) ; capsule de collision serveur ; message `fire` réservé dans `protocol` (non implémenté) ; historique de positions dans `replication/` (compensation de latence) |
| Missions | `extensions.missionHooks` des fiches d'action ; effet `mission_progress` ; vues privées par joueur dans la réplication (entités `private`) |
| Police, criminalité | `extensions.legality` et `witnessable` ; lieux `sanctuary` ; trafic synchronisé (§17.3) |
| Autres commerces de joueurs, vente et location entre joueurs | `business.type` générique (seuls `maquis` et `boutique` sont activés) ; `lease.lessor_kind` prévu pour `character` |
| Téléphone en jeu, messagerie privée, chat vocal | Dossier `ui/` prêt pour un module `phone/` ; canal `chat.channel` extensible (`private`, `group`) ; modération déjà centralisée |
| Compte permanent | `CredentialProvider`, routes réservées, `account.kind` (§20.1) |
| Autres communes | `config/<commune>.pipeline.json` ; grille UTM fixe commune à tout le District ; annuaire de cellules sans limite géographique |
| Avion | Mode `air` dans `sim-transport` ; téléportation inter-communes via un transfert d'instance |
| Couches de cellules saturées | `cellId` versionné avec un suffixe de couche (`c_12_7#1`) prévu dans `geo` |

---

## 26. Existant → devenir (fichier par fichier)

Légende : **Garder** (en place) · **Déplacer** · **Réécrire** (la logique utile est reprise, le fichier est refait) · **Supprimer** · **Archiver** (→ `docs/archive/`). Toute suppression requiert l'accord du propriétaire (CLAUDE.md).

| Fichier actuel | Devenir | Cible / remarque | Tâche |
|---|---|---|---|
| `package.json` | Réécrire | Scripts racine pnpm ; description « vie virtuelle Yopougon » ; Node ≥ 24 | T-003 |
| `package-lock.json` | Supprimer | Remplacé par `pnpm-lock.yaml` | T-003 |
| `tsconfig.base.json` | Réécrire | Garder la sévérité ; retirer `DOM` ; profils `browser`/`node`/`pure` | T-004 |
| `.env.example` | Réécrire | Retirer les variables GTA et la coquille `COLOYSEUS_` ; variables par app | T-016 |
| `.gitignore` | Réécrire | `data/cache`, `data/build`, artefacts `*.js` dans les sources TS, `.claude/*.lock` | T-001 |
| `README.md` | Réécrire | Démarrage Windows et Linux, liens vers ARCHITECTURE et roadmap, attribution OSM | T-016 |
| `CLAUDE.md` | Garder (section « Contexte projet » à mettre à jour **par le propriétaire**) | Les agents n'ont pas le droit de le modifier sans accord | T-016 |
| `SKYLINE_cahier_des_charges_v1.1.md` | Archiver | Bandeau « SUPERSEDÉ par ARCHITECTURE.md / ADR 0001 » | T-002 |
| `SKYLINE_dossier_level_design_carte_MVP.md` | Archiver | Les conventions de repère (§2.1) et de collision (§11.2) sont reprises ici | T-002 |
| `SKYLINE_plan_production_assets_v1.1_solo.md` | Archiver | Conventions reprises en §12 et §27 | T-002 |
| `SKYLINE_plan_production_assets_equipe_interne.md` | Archiver | Idem (nommage, budgets, pipeline d'asset) | T-002 |
| `check_buildings.js`, `check_buildings2.js`, `check_road.js`, `check_road.bat` | Supprimer | Debug avec chemins Windows absolus | T-001 |
| `debug_buildings.js`, `debug_roads.js`, `debug_roads2.js` | Supprimer | Idem | T-001 |
| `test_sector_gen.js`, `test_world_gen.js`, `test_output.txt` | Supprimer | Faux tests, trace d'erreur | T-001 |
| `.claude/settings.json` | Réécrire (**par le propriétaire**) | Aligner sur CLAUDE.md (demande avant Bash) | Q10 |
| `.claude/agents/*.md` (3) | Décision du propriétaire | Coexistence avec le dispositif à 5 agents | Q10 |
| `.claude/scheduled_tasks.lock` | Supprimer du suivi git | Ignoré ensuite | T-001 |
| `apps/web/package.json` | Réécrire | `@babylonjs/core`, `@babylonjs/loaders`, `preact` ; retirer `babylonjs`, `babylonjs-gui`, `colyseus.js`, `world-generator`, `vite-plugin-babel-macros` | T-013 |
| `apps/web/package-lock.json` | Supprimer | Second lockfile | T-003 |
| `apps/web/tsconfig.json` | Réécrire | Hérite de `tsconfig.browser.json` ; plus d'alias inutilisé | T-004 |
| `apps/web/vite.config.ts` | Réécrire | Plus d'alias `world-generator` ; dossier public des assets de dev ; sortie `apps/web/dist` | T-013 |
| `apps/web/index.html` | Garder (adapter) | Conteneur UI + mention d'attribution OSM | T-013 |
| `apps/web/src/main.ts` | Réécrire (découper) | Caméra libre → `src/debug/fly-camera.ts` ; overlay FPS → `src/debug/perf-overlay.ts` ; scène → `src/engine/` ; `main.ts` devient la racine de composition ; client Colyseus supprimé ; import statique de `world.json` supprimé | T-013 |
| `apps/web/src/world/WorldRenderer.ts` | Réécrire (découper) | Conversion de repère → `@skyline/geo` ; rubans de routes → `world-render/roads/` ; extrusions → pipeline (hors ligne) ; thin instances de props → `world-render/props/` ; fusion par matériau → `world-render/materials/` ; constantes 300 supprimées | T-014 |
| `apps/server/package.json`, `tsconfig.json` | Supprimer | Remplacés par `apps/services`, `apps/zone`, `apps/gateway` (J1) | T-015 |
| `apps/server/src/index.ts` | Supprimer | Idée `/health` + arrêt propre reprise dans `apps/services/src/app/` | T-015 |
| `apps/server/src/index.ts.bak` | Supprimer | — | T-001 |
| `packages/contracts/src/index.ts` | Réécrire → `packages/protocol` | Reprendre `Position`, `input`, `interact`, `purchase` (idempotence), `ping` ; supprimer `fire`, `reload`, `hit`, `death`, `pistol*` (réservés v2) | J1 (T-1xx) ; suppression du dossier en T-015 |
| `packages/game-config/world.json` | Supprimer | Remplacé par les tuiles (hors git) ; fuite de chemin local (m7) | T-015 |
| `packages/game-config/props.json`, `road-network.json` | Supprimer | Générés par le pipeline, non versionnés | T-015 |
| `packages/game-config/buildings.json`, `road-prop-config.json` | Supprimer | Morts | T-001 |
| `packages/world-generator/package.json`, `tsconfig.json` | Déplacer + réécrire | → `tools/map-pipeline/` (strict, ESM) | T-010 |
| `…/src/projection/TerrainProjection.ts` | Réécrire → `packages/geo` | UTM 30N + grille fixe ; `normalizeToBounds` **supprimé** (C1) | T-008 |
| `…/src/projection/index.ts` | Supprimer | Barrel cassé (m12) | T-010 |
| `…/src/importers/GeoJSONImporter.ts` | Réécrire (découper) | → `stages/normalize`, `stages/classify` (taxonomie de POI reprise), parsing des niveaux corrigé (m9), identifiants stables (M3) | T-011 |
| `…/src/roads/RoadNetwork.ts` | Réécrire | → `stages/roads` avec `flatbush` ; `oneway` ; branche morte supprimée (m10) ; Dijkstra → `sim-transport` (A*) | J1/J2 |
| `…/src/buildings/BuildingPlacer.ts` | Réécrire | → `stages/heights` (heuristiques §11.3) | T-011 |
| `…/src/props/PropPlacer.ts` | Réécrire | → `stages/props-vegetation` (seedé, perpendiculaire, densités en m) | J2 |
| `…/src/index.ts` (WorldGenerator) | Supprimer | Mort et bogué (M6) | T-010 |
| `…/src/*/index.ts` (barrels) | Supprimer | Interdits (§9.2) | T-010 |
| `…/scripts/import-geojson.ts` | Réécrire | → `tools/map-pipeline/src/cli/` (commande `build --config`) | T-012 |
| `…/scripts/test-*.ts` (4) | Supprimer | Remplacés par de vrais tests Vitest | T-010 |
| `…/scripts/*.js`, `*.d.ts`, `*.map` (15) | Supprimer | Artefacts compilés versionnés | T-001 |
| `prisma/schema.prisma` | Réécrire → `packages/db/prisma/schema.prisma` | Schéma §19 (J6) ; en J0, l'actuel est archivé | T-015 |
| `config/prisma/schema.prisma` | Supprimer | Doublon exact | T-003 |
| `config/typescript/*.json`, `config/vite/web.config.ts` | Supprimer | Doublons morts | T-003 |
| `data/source/export.geojson` | Déplacer | → `tools/map-pipeline/test/fixtures/pigeons-sample.geojson` (fixture golden, mention ODbL conservée) | T-011 |
| `public-assets/npc_kader_lod0.glb` | Supprimer ou archiver (décision du propriétaire) | Asset GTA ; peut servir de test du chargeur glb | T-002 |
| `docs/cartographie-projet.md` | Garder | Photographie de l'existant au 13/10/2026 | — |

---

## 27. Conventions de code

- **Nommage** : fichiers en `kebab-case.ts` ; types et classes en `PascalCase` ; fonctions et variables en `camelCase` ; constantes de configuration en `SCREAMING_SNAKE_CASE` ; paquets `@skyline/<nom>`.
- **Identifiants de contenu** : `categorie.nom_snake` (`food.eat_garba`, `job.attieke_vendor`) ; assets : `categorie_nom_variante_lod` (`bld_shopfront_shutter_b_lod0`), conventions reprises du plan d'assets.
- **Erreurs** : erreurs typées (`Result<T, E>` pour le métier, exceptions pour l'imprévu) ; aucun `catch` vide ; codes d'erreur stables.
- **Asynchrone** : pas de promesse flottante (`no-floating-promises`) ; annulation via `AbortSignal` pour le streaming.
- **Logs** : `logger.child({ module })` ; niveaux `debug` / `info` / `warn` / `error` ; aucune donnée personnelle.
- **Tests** : `*.test.ts` à côté du code ; noms de tests en anglais au format « should … when … ».
- **Git** : Conventional Commits en anglais ; une tâche = une branche = une PR de moins de 400 lignes (CLAUDE.md).
- **Unités** : mètres, secondes réelles (`*Ms`, `*S`), minutes de jeu (`*GameMin`), Djai en `bigint` côté serveur ; toute heure ou date de jeu passe par `sim-clock` (jamais `Date.now()` ni `new Date()` dans une règle) ; le suffixe d'unité est obligatoire dans les noms ambigus.
- **i18n** : aucune chaîne destinée au joueur dans le code (lint `no-literal-string` sur `apps/web/src/ui` et les messages serveur) ; clés `domaine.sous_domaine.cle` ; registre `standard` ou `nouchi` sur les répliques de PNJ ; formatage des nombres et des Djai via `@skyline/i18n`.
- **Multiplateforme** : scripts npm sans syntaxe bash (utiliser des scripts Node), fins de ligne normalisées par `.gitattributes` (LF), aucun chemin absolu.

---

## 28. Règles non-négociables (critères de l'agent Review)

1. **Serveur autoritaire** : aucun gain, coût, résultat d'action, solde ou inventaire décidé côté client.
2. **Économie** : toute écriture de Djai passe par `EconomyPort.commit`, avec une clé d'idempotence ; somme des jambes nulle ; solde ≥ 0 ; aucun `UPDATE balance` hors du module `economy`.
3. **Validation** : toute donnée entrante (HTTP, WebSocket, bus, fichiers de contenu et de tuile) est validée par schéma ou par un codec borné avant usage.
4. **Aucun secret** dans le code, les logs, les commits, la documentation ou les fichiers de données ; `.env.example` contient des valeurs factices uniquement.
5. **Toute route HTTP mutante est authentifiée** et limitée en débit ; toute action WebSocket est liée à un personnage authentifié.
6. **Attribution ODbL** présente dans le client et dans `ATTRIBUTION.md` ; les couches `osm-derived` et `game-authored` ne sont pas fusionnées.
7. **Modularité** : règles du §9 respectées (tailles, interdits, matrice de dépendances) ; CI verte sur ESLint et dependency-cruiser.
8. **Déterminisme** : pas de `Math.random` dans `tools/map-pipeline` ni dans `packages/sim-*` ; le test golden du pipeline passe.
9. **Pas de licence GPL/AGPL** dans les dépendances livrées ; tout asset tiers figure au registre avec sa licence.
10. **Pas de données personnelles dans les logs** (ni e-mail, ni IP en clair, ni secret d'invité).
11. **Budgets de performance** : toute PR qui touche au rendu ou au streaming fournit une mesure sur la scène de référence ; une régression de plus de 10 % des FPS p5 est refusée sans justification.
12. **Protocole** : tout changement incompatible incrémente `protocolVersion` et met à jour les tests de compatibilité.
13. **Aucune feature hors périmètre** (§2.2) sans ADR acceptée par le propriétaire.
14. **i18n** : aucun texte joueur en dur ; toute clé utilisée existe dans `content/i18n/fr-CI/` (vérifié par content-cli).
15. **Noms de lieux** : les noms affichés viennent exclusivement de l'étape `naming` du pipeline (toponymie réelle, marques et commerces parodiés, surcharges) et sont échappés ; aucune marque réelle, aucun logo ni charte graphique reproduits ; la table des grandes marques est revue par un humain avant chaque release (ADR 0010).
16. **Temps** : toute règle horaire passe par `sim-clock` et le segment d'horloge du serveur ; aucune règle n'utilise l'horloge du client (ADR 0011).

---

## 29. Journal de décisions (index des ADR)

| ADR | Décision | Statut |
|---|---|---|
| [0001](docs/adr/0001-vie-virtuelle-yopougon-supersede-cdc.md) | La vision « vie virtuelle Yopougon » remplace le CDC v1.1 | Acceptée (propriétaire, 13/10/2026) |
| [0002](docs/adr/0002-grille-tuiles-250m-utm.md) | Grille de tuiles de 250 m en UTM 30N + hiérarchie de LOD ; cellules ≠ tuiles | Proposée |
| [0003](docs/adr/0003-architecture-mmo-passerelle-cellules-nats.md) | Architecture MMO passerelle + cellules + NATS ; abandon de Colyseus | Proposée |
| [0004](docs/adr/0004-moteur-actions-data-driven.md) | Moteur d'actions piloté par les données | Proposée |
| [0005](docs/adr/0005-rendu-semi-realiste-kits-proceduraux.md) | Rendu semi-réaliste par kits modulaires procéduraux | Proposée (choix du propriétaire, conditions de coût) |
| [0006](docs/adr/0006-odbl-separation-couches.md) | ODbL : attribution, séparation des couches, publication de la base dérivée | Proposée |
| [0007](docs/adr/0007-monorepo-pnpm-regles-modularite.md) | Monorepo pnpm + règles de modularité outillées | Proposée |
| [0008](docs/adr/0008-babylon-es-modules.md) | `@babylonjs/core` (ES modules) à la place du paquet UMD | Proposée |
| [0009](docs/adr/0009-economie-grand-livre-partie-double.md) | Économie en grand livre à partie double, idempotente (achats, loyers, titres, commerces, séquestre des salaires) | Proposée |
| [0010](docs/adr/0010-noms-lieux-toponymie-reelle-marques-parodiees.md) | Toponymie réelle, marques et commerces parodiés de façon déterministe, avec garde-fous | Acceptée (propriétaire) |
| [0011](docs/adr/0011-horloge-interne-du-monde.md) | Horloge interne du monde, autoritaire, ratio configurable, règle hors ligne | Acceptée (propriétaire) ; ratio et règle hors ligne à valider |
| [0012](docs/adr/0012-invite-uniquement-extension-compte.md) | Profil invité uniquement au MVP, compte permanent en point d'extension | Acceptée (propriétaire) |

---

## 30. Consignes pour l'agent Design

1. Tu interviens dans `apps/web/src/ui/`, `apps/web/src/world-render/materials|lighting/`, `content/i18n/fr-CI/`, `content/dialogues/` et `assets-src/` (conventions d'assets). Tu ne touches ni à `apps/zone`, ni à `apps/services`, ni à `packages/sim-*`.
2. L'UI est en **Preact + signals**, en HTML et CSS. Babylon GUI est réservé aux étiquettes dans le monde (noms au-dessus des têtes, bulles d'interaction).
3. Langue : **français** (locale `fr-CI`) pour tout texte joueur, via des clés i18n (`content/i18n/fr-CI/<domaine>.json`). Aucun texte en dur dans les composants. Les **dialogues de PNJ** (`content/dialogues/`) intègrent du **nouchi** (registre `nouchi`), relu par un locuteur (le propriétaire) ; l'UI système reste en français standard, compréhensible par tous.
4. Le HUD MVP comprend les 5 jauges de besoins, le solde de Djai (`wallet_update` uniquement), l'**heure et le jour de jeu** (horloge interne), l'invite d'interaction, la progression de l'action en cours, les notifications et le **chat de proximité**. Écrans à prévoir : accueil (**jouer en invité**, sans inscription), affichage du **code de récupération** et restauration, création d'avatar, chargement (avec **attribution OSM**), inventaire, menu d'actions contextuel, logement (bail, loyer, achat), **gestion de commerce** (stock, prix dans les bornes, horaires, employés, caisse), offres d'emploi, carte de la commune, paramètres (profil de qualité, touches AZERTY/QWERTY, accessibilité, code de récupération), crédits et **mentions légales** (y compris la mention sur les noms de lieux et le formulaire de retrait). **Pas de téléphone en jeu au MVP.**
5. **Accessibilité** : contraste AA, tailles de texte réglables, aucune information portée uniquement par la couleur (jauges avec icône et valeur), navigation au clavier dans les menus, cibles ≥ 44 px (prêt pour le mobile).
6. Le menu d'actions affiche les actions **grisées avec la raison** (« Pas assez de Djai », « Fermé — ouvre à 06:00 ») à partir de l'aperçu non autoritaire ; il n'anticipe **jamais** un gain ou une dépense.
7. **Noms parodiés, aucun logo** : les marques et commerces portent leur nom parodique (« Oronge », « MTM »), la toponymie garde son nom réel (ADR 0010). Aucun logo, aucune couleur dominante ni charte graphique d'une marque réelle, y compris sur les enseignes 3D, kiosques et emballages ; aucun contenu dénigrant. Le nom affiché vient toujours des métadonnées de tuile produites par l'étape `naming`.
8. Direction artistique : semi-réaliste PBR, palette chaude et saturée par le soleil, salissures et usure visibles, enseignes peintes à la main ; les références photographiques de Yopougon sont à collecter avec le propriétaire. Un seul parti pris PBR pour tout le jeu.
9. Budgets : respecter §10.4 et §12.7. Tout nouvel asset passe par `tools/asset-pipeline` (nommage, échelle 1 u = 1 m, pivot au sol, LOD, KTX2) et figure au registre d'assets avec sa licence.
10. Avant toute production en série d'un lot (façades, personnages), un prototype est validé **en jeu** sur la machine de référence basse.

## 31. Consignes pour l'agent Backend

1. Périmètre : `apps/gateway`, `apps/zone`, `apps/services`, `packages/{protocol,physics,sim-*,economy-rules,bus,observability,db,geo,tile-format,content-schema}`, `tools/{map-pipeline,content-cli,bots}`.
2. La logique de jeu va dans des paquets **purs**, testés unitairement. `apps/zone` ne fait qu'orchestrer (tick, ports, réplication). `apps/zone` **n'importe jamais** `@skyline/db`.
3. API HTTP : **REST versionné sous `/api/v1`** (Fastify), DTO validés par Zod, erreurs au format `{error:{code,message}}`. Temps réel : protocole de §14.2, version contrôlée à la poignée de main.
4. Économie : implémenter le contrat `EconomyPort.commit` (§18) avec une transaction PostgreSQL (verrou de ligne `SELECT … FOR UPDATE` sur les comptes concernés, triés par id pour éviter les interblocages), une clé d'idempotence unique et la contrainte `balance >= 0`. Tests de propriétés et de concurrence obligatoires (même clé ×100 en parallèle → une seule écriture).
5. Pipeline : déterministe (graines dérivées des identifiants OSM), incrémental, multiplateforme. osmium uniquement via Docker ; aucun chemin absolu. Le build échoue si une tuile dépasse les budgets (§10.4). Le test golden sur la fixture de Pigeons est maintenu.
6. Collisions : un seul format (`collision.bin`), un seul code de requête (`@skyline/physics`) pour le client et le serveur.
7. Modes `all-in-one` et `distributed` : le code métier ne sait pas dans lequel il tourne. Bus en mémoire pour les tests, NATS à partir de J5.
8. Persistance : points de sauvegarde toutes les 60 s ; l'argent est écrit avant d'être annoncé au client ; aucune donnée durable ne vit seulement en mémoire d'une cellule.
9. Toute nouvelle dépendance, migration ou modification de configuration (CI, Docker, `.env`) exige l'accord du propriétaire (CLAUDE.md). Les artefacts d'infra sont **préparés, jamais exécutés**.
10. Observabilité dès le premier service : logs pino, métriques de tick et de bande passante, `/health` et `/ready`.

## 32. Consignes pour l'agent Sécurité

1. Vérifier à chaque revue les règles 1 à 6 et 10 du §28.
2. Modèle de menace prioritaire : client modifié (vitesse, téléportation, actions hors site, rejeu de `requestId`, falsification de montants), **vol ou force brute du jeton d'appareil / code de récupération**, fermes de profils invités, abus du chat (harcèlement, échange de numéros avec des mineurs, arnaques), commerce de Djai contre de l'argent réel, **boucles d'argent via les commerces et les emplois entre joueurs**, prix abusifs, déni de service sur la passerelle (connexions, taille et cadence des messages), injection via les tags OSM et les noms de commerces de joueurs (**échapper**, ne jamais interpréter comme du HTML).
3. Authentification : jeton d'appareil ≥ 128 bits stocké haché (comparaison à temps constant), restauration limitée et verrouillée progressivement, régénération qui révoque l'ancien ; JWT d'accès de 15 min à clé asymétrique, rafraîchissement par rotation avec détection de réutilisation, ticket de passerelle à usage unique de 60 s. Argon2id est réservé à l'extension compte permanent.
4. Transport : TLS hors local, CSP stricte, CORS restreint, en-têtes de sécurité (Fastify helmet), NATS authentifié et chiffré, PostgreSQL avec un rôle par module.
5. Limites : débit par connexion, IP et compte ; taille maximale des messages ; compteur de violations ; plafonds économiques (§18) ; détection d'anomalies sans bannissement automatique définitif.
6. Données personnelles : minimisation (§20.3), aucune PII dans les logs, export et suppression fonctionnels et testés, rétention des IP ≤ 30 jours, registre des traitements. Préparer le dossier de **formalité ARTCI** (loi 2013-450) et signaler que l'hébergement hors de Côte d'Ivoire constitue un transfert à encadrer. Validation par un juriste avant la bêta publique.
7. Licences : ODbL (attribution, publication de la couche dérivée), licences des assets et des dépendances (pas de GPL/AGPL livrée).
8. Chaîne d'approvisionnement : lockfile pnpm figé, audit des dépendances en CI, vérification du sha256 de l'instantané OSM, image Docker osmium figée par digest.
9. Toute vulnérabilité découverte est signalée immédiatement au propriétaire (CLAUDE.md).

---

## Questions ouvertes (à trancher par le propriétaire)

| # | Question | Recommandation par défaut |
|---|---|---|
| Q1 | Budget art : un artiste 3D freelance à temps plein dès J1 ? (§3.2) | Oui, sinon accepter +6 à 9 mois ou un rendu gris |
| Q2 | Abandon de Colyseus au profit de passerelle + cellules + NATS (§3.6, ADR 0003) ? | Oui |
| Q3 | Quartier pilote de J1 : celui de la fixture (secteur « Pigeons », ≈ 5,329° N / 4,068° O), dont l'appartenance à Yopougon reste à confirmer, ou un autre (Rue Princesse, grand marché) ? | Un quartier dense et emblématique, entièrement dans Yopougon |
| Q5 | Alcool au maquis (bière fictive) : oui ou non ? Impact sur l'âge minimum | Boissons sucrées uniquement au MVP |
| Q6 | Âge minimum des joueurs | 16 ans [H], chat de proximité filtré |
| Q7 | Hébergement : Europe (transfert hors CI à encadrer auprès de l'ARTCI) ou Afrique de l'Ouest ? À décider après le spike de latence SP4 | Décider sur mesures |
| Q8 | Validation juridique du montage ODbL (couches séparées) et de la loi 2013-450 | À faire avant la bêta publique |
| Q9 | Licence du code (propriétaire fermé ou open source) | Propriétaire fermé ; la couche osm-derived reste publiée sous ODbL |
| Q10 | Agents : le dispositif à 5 agents remplace-t-il `.claude/agents/*` (tech-lead-po, devops, qa) ? `.claude/settings.json` à aligner sur CLAUDE.md | Un seul dispositif ; mise à jour par le propriétaire |
| Q11 | Langue des ADR et de la documentation technique : CLAUDE.md impose l'anglais, la session a demandé le français | Français pour les documents de cadrage (ce lot), anglais pour la documentation de code |
| Q12 | Plafonds : transferts entre joueurs (§3.5), salaires et retraits de caisse des commerces (§3.8, §16.5), ancienneté minimale | 7 jours d'ancienneté, plafonds journaliers faibles, révisés après la bêta |
| Q13 | Ratio de l'horloge interne : 1 jour de jeu = 2 h réelles (facteur 12) ? | Oui pour la bêta, à réévaluer sur les mesures de jeu |
| Q14 | Règle hors ligne (§16.1) : besoins gelés ; loyers qui courent en temps de jeu, avec préavis de 7 jours réels et 2 échéances impayées avant la fin du bail ; salaires seulement pour le travail effectif ; PNJ gérant payé par heure de jeu avec fermeture automatique ? | Oui |
| Q15 | Force de la déformation des marques (§3.4) : distance minimale de 2 et ≥ 30 % de la longueur ? | Oui, avec revue humaine et validation juridique (Q8) |
