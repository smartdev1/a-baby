# Roadmap — SKYLINE : Yopougon, vie virtuelle

|                      |                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Statut**           | v1, 13/10/2026, agent Architecte                                                                                         |
| **Référence**        | `ARCHITECTURE.md` (les numéros §x renvoient à ce document), ADR dans `docs/adr/`                                         |
| **Échéance**         | **Aucune** (décision du propriétaire). Les durées sont **indicatives** et servent à planifier, pas à s'engager           |
| **Backlog détaillé** | J0 uniquement, dans `docs/backlog/T-001` à `T-022`. Les jalons suivants seront découpés en tâches au démarrage de chacun |

---

## 1. Hypothèses de planification

| ID  | Hypothèse                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | 3 personnes : le propriétaire (PO, contenu, relecture du nouchi, ~0,5 ETP de dev) + Aristide Adouko + smartdev1, soit **≈ 2,5 ETP de développement**                                  |
| P2  | **1 artiste 3D / technical artist freelance à temps plein à partir de J1** (ARCHITECTURE §3.2, Q1). Sans lui : J2, J3 et J7 s'allongent de 6 à 9 mois cumulés, ou le rendu reste gris |
| P3  | 1 semaine = 5 jours ouvrés ; ≈ 15 % du temps part en revues, tests, rituels et imprévus (déjà inclus dans les fourchettes)                                                            |
| P4  | Tailles de tâches : **S** ≤ 2 jours, **M** 3 à 5 jours, **L** 6 à 10 jours. Au-delà, la tâche est découpée                                                                            |
| P5  | Développement local uniquement (CLAUDE.md) : les jalons « bêta » produisent des artefacts de déploiement **prêts**, exécutés par le propriétaire quand il le décide                   |
| P6  | Les postes Windows et Linux sont tous deux supportés à chaque jalon                                                                                                                   |

### Couloirs de travail (3 en parallèle)

| Couloir         | Périmètre                                                                                                       | Profil                             |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **C — Client**  | `apps/web` : moteur, streaming, rendu, personnage, UI                                                           | dev à dominante front/3D           |
| **D — Données** | `tools/map-pipeline`, `content/`, `tools/content-cli`, `tools/asset-pipeline`, intégration art                  | dev à dominante data/géo + artiste |
| **S — Serveur** | `apps/zone`, `apps/gateway`, `apps/services`, paquets `sim-*`, `protocol`, `physics`, économie                  | dev à dominante back/réseau        |
| **PO**          | Propriétaire : priorisation, contenu (fiches d'actions, lieux, lignes, dialogues en nouchi), recette, décisions | —                                  |

L'affectation des personnes aux couloirs est à décider par le propriétaire. Une personne peut changer de couloir entre deux jalons.

---

## 2. Vue d'ensemble

| Jalon                                                 | Objectif démontrable                                                                                                                 | Durée indicative                    | Semaines (cumul, avec chevauchements)                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------- |
| **J0** Assainissement & fondations                    | Dépôt propre, CI préparée, fixture OSM rendue **à l'échelle 1:1** via des tuiles produites par un pipeline déterministe              | 5 – 6 sem.                          | S1 – S6                                                                             |
| **J1** Marcher dans un quartier en streaming          | Un avatar marche dans un **quartier pilote de ≈ 1 km²** de Yopougon, chargé en tuiles, avec collisions, via un serveur de zone local | 8 – 10 sem.                         | S7 – S16                                                                            |
| **J2** Tout Yopougon                                  | Toute la commune traversable, LOD, relief, eau, végétation, kit semi-réaliste v1, ≥ 30 FPS sur PC modeste                            | 9 – 11 sem.                         | S17 – S27                                                                           |
| **J3** Vie quotidienne                                | Besoins, moteur d'actions, ≈ 35 actions, 5 métiers PNJ, PNJ fonctionnels, nuit vivante                                               | 10 – 12 sem.                        | S21 – S32 (démarre pendant J2)                                                      |
| **J4** Transports                                     | Taxi, woro-woro, gbaka, bus SOTRA, moto et voiture personnelles, trafic d'ambiance                                                   | 8 – 10 sem.                         | S33 – S42                                                                           |
| **J5** Multijoueur MMO                                | Passerelle, cellules multi-processus, transferts, aire d'intérêt, chat de proximité ; **1 000 bots**                                 | 8 – 10 sem.                         | S35 – S44 (couloir S en parallèle de J4)                                            |
| **J6** Économie, propriété, commerces, persistance    | Profils invités, grand livre, location et achat de logements, **commerces de joueurs avec employés**, sauvegardes                    | 10 – 12 sem.                        | S43 – S54                                                                           |
| **J7** Polish, perf, prêt pour le mobile, bêta fermée | Profils de qualité, accessibilité, modération, observabilité, conformité, artefacts de déploiement                                   | 6 – 8 sem.                          | S55 – S62                                                                           |
| **Total jusqu'à la bêta fermée**                      |                                                                                                                                      |                                     | **≈ 55 à 65 semaines (13 à 15 mois)** avec P1 et P2 ; **18 à 22 mois** sans artiste |
| v2-A Extension Abidjan                                | Autres communes (données + contenu)                                                                                                  | 3 – 5 sem. par commune après la 1re | après la bêta                                                                       |
| v2-B Combat, missions, police                         | Couche de gameplay sur les points d'extension                                                                                        | 4 – 6 mois                          | après la bêta                                                                       |

```text
Semaines   1    6    11   16   21   26   31   36   41   46   51   56   61
J0         ██████
J1               ██████████
J2                         ███████████
J3                             ████████████
J4                                         ██████████
J5                                           ██████████
J6                                                     ████████████
J7                                                                 ████████
Spikes     SP2 SP4 │SP1 SP3 SP5 SP6│SP7
```

---

## 3. Chemin critique et spikes

### 3.1. Chemin critique

```text
T-008 geo ─► T-009 tile-format ─► T-011/T-012 pipeline fixture ─► T-014 chargeur client
   ─► SP1 (rendu + streaming sur PC modeste) ─► J1 streaming + contrôleur + zone locale
   ─► J2 pipeline commune entière (SP2) ─► J4 graphe routier et lignes à l'échelle
   ─► J5 MMO distribué (SP3) ─► J6 économie / commerces ─► J7 bêta fermée
```

- Le **rendu semi-réaliste sur PC modeste** (SP1) et le **pipeline à l'échelle de la commune** (SP2) sont les deux maillons les plus incertains, d'où leur place au tout début.
- J3 (actions) **n'est pas** sur le chemin critique grâce au chevauchement avec J2 : il démarre sur le quartier pilote (ARCHITECTURE §3.3).
- J5 (MMO) est préparé en arrière-plan par SP3 dès J1. Il ne dépend que du protocole et de la simulation de zone, pas de la carte complète.

### 3.2. Spikes (dérisquage précoce, livrable = rapport dans `docs/spikes/`)

| Spike                                                  | Question à trancher                                                                                                                                                                              | Quand      | Couloir                     | Taille | Critère de sortie                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| **SP2** Couverture OSM de Yopougon                     | Identifiant de la relation administrative ? Nombre de bâtiments, % avec hauteur, qualité des routes, POI, relations `route=bus`, zones vides ?                                                   | J0 (T-018) | D                           | M      | Rapport chiffré + carte des trous ; décision sur les sources complémentaires                                          |
| **SP4** Latence depuis Abidjan                         | Quelle région d'hébergement (Europe de l'Ouest, Lagos, Johannesburg…) donne le meilleur RTT p50/p95 sur Orange, MTN et Moov, en fixe et en mobile ?                                              | J0 (T-019) | S + PO (testeurs à Abidjan) | S      | Tableau de RTT par réseau et par région ; recommandation (Q7)                                                         |
| **SP1** Rendu semi-réaliste + streaming sur PC modeste | 16 tuiles L0 denses + kit de façades provisoire (thin instances, tableau de textures, KTX2, ombres) tiennent-elles ≥ 30 FPS sur la machine basse (H5) ? Combien de ms par intégration de tuile ? | Début J1   | C + artiste                 | L      | Mesures sur la machine de référence ; budgets §10.4 et §12.7 confirmés ou révisés ; **go/no-go sur le semi-réaliste** |
| **SP3** MMO multi-processus                            | 2 processus de zone + 1 passerelle + NATS : transferts transparents < 100 ms, 500 bots, tick p95 ≤ 25 ms, bande passante ≤ 25 Ko/s/joueur ?                                                      | J1 – J2    | S                           | L      | Rapport de charge ; protocole de transfert validé                                                                     |
| **SP5** Personnages modulaires + foule                 | Squelette commun + vêtements + coiffures (tresses) + VAT pour 200 PNJ d'ambiance : coût CPU et GPU ?                                                                                             | J1         | C + artiste                 | M      | Mesures ; pipeline d'animation retenu                                                                                 |
| **SP6** Physique partagée                              | Le contrôleur 2,5D donne-t-il < 5 % de corrections fortes à 150 ms de RTT avec 2 % de perte ?                                                                                                    | J1         | S                           | M      | Taux de réconciliation mesuré                                                                                         |
| **SP7** Nuit de Yopougon                               | Éclairage nocturne (lampadaires, enseignes, phares) crédible dans le budget du profil Bas ? Avec un cycle de 2 h réelles, la nuit occupe environ 40 % du temps de jeu                            | Début J2   | C + artiste                 | M      | Captures + mesures                                                                                                    |

---

## 4. Jalons détaillés

Notation des tâches : `ID — intitulé — taille — dépendances — couloir`. Les tâches d'un même couloir s'enchaînent ; des couloirs différents avancent en parallèle.

---

### J0 — Assainissement & fondations (5 à 6 semaines)

**Objectif démontrable** : depuis un poste Windows comme Linux, `pnpm install` puis `pnpm test` passent ; `pnpm map:build --config fixture` produit des tuiles **identiques octet pour octet** à chaque exécution ; le client affiche le quartier de la fixture (secteur « Pigeons ») **à l'échelle 1:1** (bâtiments en vraies emprises triangulées, routes à la bonne largeur), avec l'attribution OSM visible. Les rapports SP2 et SP4 sont livrés.

**Livrables** : dépôt nettoyé ; monorepo pnpm ; lint, frontières et tests outillés ; CI préparée ; paquets `geo`, `tile-format`, `i18n` ; pipeline v0 ; client migré vers `@babylonjs/core` ; documentation de base ; spikes SP2 et SP4.

| ID    | Tâche                                                                                                | Taille | Dépend de    | Couloir      |
| ----- | ---------------------------------------------------------------------------------------------------- | ------ | ------------ | ------------ |
| T-001 | Supprimer les scripts de debug, les artefacts compilés et les fichiers morts                         | S      | —            | D            |
| T-002 | Archiver les documents supersédés (CDC, LD, plans d'assets)                                          | S      | —            | PO           |
| T-003 | Passer à pnpm + Node 24 LTS, lockfile unique, supprimer les doublons de config                       | M      | T-001        | S            |
| T-004 | Socle TypeScript : profils `browser` / `node` / `pure`                                               | S      | T-003        | S            |
| T-005 | ESLint + Prettier + règles de modularité + dependency-cruiser                                        | M      | T-004        | S            |
| T-006 | Vitest en workspace, couverture, fast-check                                                          | S      | T-004        | S (owner QA) |
| T-007 | CI préparée (Ubuntu + Windows) : lint, typecheck, test, frontières                                   | M      | T-005, T-006 | S            |
| T-008 | Paquet `@skyline/geo` : UTM 30N, grille fixe, TileKey/CellKey                                        | M      | T-004        | D            |
| T-009 | Paquet `@skyline/tile-format` v0 : schémas meta/manifeste, codec `collision.bin`                     | M      | T-008        | D            |
| T-010 | `tools/map-pipeline` : squelette CLI, retrait de `world-generator`                                   | M      | T-003, T-008 | D            |
| T-011 | Étapes `normalize` / `classify` / `heights` v0 + fixture golden                                      | L      | T-010        | D            |
| T-012 | Étapes `tile-cut` / `encode` / `manifest` sur la fixture (earcut hors ligne)                         | L      | T-009, T-011 | D            |
| T-013 | Client : `@babylonjs/core`, racine de composition, modules de debug, attribution OSM                 | M      | T-004, T-021 | C            |
| T-014 | Client : chargeur de tuiles v0, rendu de la fixture à l'échelle 1:1                                  | M      | T-012, T-013 | C            |
| T-015 | Retirer le serveur Colyseus squelette, `contracts`, `game-config`, archiver le schéma Prisma         | S      | T-003        | S            |
| T-016 | README, `.env.example`, `docs/conventions.md`, `context.md`, `tech-debt.md`                          | S      | T-003        | PO + S       |
| T-017 | `ATTRIBUTION.md` et conformité ODbL de base                                                          | S      | —            | PO           |
| T-018 | Spike SP2 : couverture OSM de Yopougon                                                               | M      | T-022        | D            |
| T-019 | Spike SP4 : latence depuis Abidjan                                                                   | S      | —            | S + PO       |
| T-020 | Harness de performance client + définition des machines de référence                                 | M      | T-013        | C            |
| T-021 | Paquet `@skyline/i18n` + `content/i18n/fr-CI` + règle « pas de texte en dur »                        | S      | T-004        | C            |
| T-022 | Acquisition reproductible : `sources.lock.json` + image Docker osmium + étapes `acquire` / `extract` | M      | T-010        | D            |

**Charge** : 9 S + 11 M + 2 L ≈ 70 à 75 jours de développement, soit environ 5 à 6 semaines à 2,5 ETP.

**Critères d'acceptation mesurables**

- `pnpm install && pnpm lint && pnpm typecheck && pnpm test` passent sous Windows 11 et sous Linux.
- Deux builds successifs de la fixture produisent des tuiles de **même sha256**.
- Écart entre l'emprise d'un bâtiment rendu et sa géométrie OSM projetée : **< 0,05 m** ; largeur d'une rue résidentielle rendue : **6 m ± 0,1 m** (bug d'échelle C1 corrigé).
- Bâtiments en L ou en U rendus avec leur forme réelle (plus de boîte englobante, M1 corrigé).
- Aller-retour WGS84 → UTM → WGS84 : erreur **< 1 cm** (test de propriété, 10 000 tirages sur l'emprise du District).
- dependency-cruiser : 0 violation ; aucun fichier source > 400 lignes ; aucun `any`.
- Bundle initial du client (gzip) **≤ 50 %** de la taille actuelle avec le paquet UMD (mesure avant/après dans T-013).
- Attribution « © les contributeurs d'OpenStreetMap » visible à l'écran de chargement et en jeu.

**Risques**

| Risque                                                            | Probabilité | Impact                       | Parade                                                                                            |
| ----------------------------------------------------------------- | ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| Docker Desktop indisponible ou lent sur un poste Windows          | Moyenne     | Pipeline bloqué sur ce poste | osmium seulement pour `extract` ; sorties d'extraction partageables ; Overpass scripté en secours |
| Relation administrative de Yopougon absente ou imprécise dans OSM | Moyenne     | Limite de commune fausse     | SP2 ; polygone de limite versionné dans la config en dernier recours                              |
| Migration pnpm perturbant les habitudes de l'équipe               | Faible      | Friction                     | README pas à pas ; scripts identiques                                                             |

---

### J1 — Marcher dans un quartier en streaming (8 à 10 semaines)

> **Mise à jour 13/10/2026 (décisions du propriétaire)** : pas de quartier pilote — J1 porte sur **tout Yopougon** (2 901 tuiles déjà produites par T-012) ; pas d'artiste externe, l'art est produit en interne par le développeur frontend. Tâches backend détaillées : `docs/backlog/T-101` à `T-111` (T-111 avance l'étape `naming` de J2).

**Objectif démontrable** : un joueur ouvre le jeu, crée un avatar simple, apparaît dans le **quartier pilote** (≈ 1 km², à choisir en Q3), le parcourt à pied à la 3e personne avec collisions, et voit les tuiles arriver et repartir autour de lui sans saccade, **de jour comme de nuit** (horloge interne du monde). Son déplacement est validé par un serveur de zone qui tourne en local (mode `all-in-one`).

**Livrables** : SP1, SP3 (démarré), SP5, SP6 ; pipeline des étapes `roads`, `facades-roofs` v0, `collision`, `props-vegetation` v0 ; streaming L0 et L1 ; contrôleur de personnage partagé ; `apps/zone` et `apps/gateway` minimaux ; protocole v1 (`hello`, `input`, `snapshot`, `input_ack`, `world_clock`) ; `sim-clock` et horloge interne du monde (segments, ratio configurable) ; kit de façades gris v0 puis premiers modules de l'artiste.

| ID    | Tâche                                                                                                                                                                                       | Taille | Dépend de    | Couloir |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | ------- |
| J1-01 | SP1 : banc de rendu semi-réaliste et streaming sur la machine basse                                                                                                                         | L      | T-014, T-020 | C + art |
| J1-02 | Étape `roads` : graphe avec `flatbush`, `oneway`, largeurs, trottoirs                                                                                                                       | L      | T-012        | D       |
| J1-03 | Étape `facades-roofs` v0 : travées, grammaire de profil, listes d'instances, toits plats et en tôle                                                                                         | L      | T-012        | D       |
| J1-04 | Étape `collision` : prismes + champ de hauteur → `collision.bin`                                                                                                                            | M      | T-009, T-012 | D       |
| J1-05 | Étape `props-vegetation` v0 (seedé, perpendiculaire à la voie, densités en m)                                                                                                               | M      | J1-02        | D       |
| J1-06 | Kit de façades v0 gris (≈ 20 modules) + `tools/asset-pipeline` (contrôle de nommage, d'échelle, meshopt, KTX2)                                                                              | M      | —            | D + art |
| J1-07 | Client : planificateur de tuiles, worker de décodage, intégration par tranches, cache                                                                                                       | L      | T-014        | C       |
| J1-08 | Client : rendu des façades par thin instances + plugin de matériau (teinte, salissure, index de tableau)                                                                                    | L      | J1-03, J1-06 | C       |
| J1-09 | Client : LOD L1 (étape `lod-build` côté D) et fondu enchaîné                                                                                                                                | M      | J1-07        | C + D   |
| J1-10 | `@skyline/physics` : contrôleur 2,5D (capsule, prismes, champ de hauteur), pas fixe                                                                                                         | L      | T-009        | S       |
| J1-11 | SP6 : prédiction et réconciliation sous RTT de 150 ms et 2 % de perte                                                                                                                       | M      | J1-10, J1-13 | S       |
| J1-12 | `@skyline/protocol` v1 : codecs binaires bornés + MessagePack/Zod + tests de fuzz                                                                                                           | M      | T-004        | S       |
| J1-13 | `apps/gateway` + `apps/zone` minimaux, mode `all-in-one`, bus en mémoire, une cellule                                                                                                       | L      | J1-12, J1-10 | S       |
| J1-14 | `@skyline/sim-clock` (segments d'horloge, ratio de `content/game-config/clock.json`, calendrier de jeu) + module `world-clock` minimal + correction de dérive côté client + cycle jour/nuit | M      | T-004        | S + C   |
| J1-15 | Client : caméra 3e personne, entrées abstraites (`InputIntent`), AZERTY/QWERTY                                                                                                              | M      | T-013        | C       |
| J1-16 | SP5 : personnage modulaire + animation + VAT de foule                                                                                                                                       | M      | J1-06        | C + art |
| J1-17 | Client : avatar de base (2 corps, 5 tenues, 3 coiffures) + éditeur minimal                                                                                                                  | M      | J1-16        | C + art |
| J1-18 | SP3 (début) : 2 processus de zone + NATS, transfert d'une entité                                                                                                                            | L      | J1-13        | S       |
| J1-19 | Contenu : choix et profil du quartier pilote, premiers `place-types` (maquis, garba, boutique)                                                                                              | S      | T-018        | PO      |

**Critères d'acceptation mesurables**

- Machine **basse** (H5), profil Bas : **≥ 30 FPS en p5** sur le parcours scripté du quartier pilote, de jour comme de nuit ; machine moyenne (H6), profil Moyen : ≥ 60 FPS en médiane.
- **Premier rendu jouable ≤ 15 s** à froid (connexion de 20 Mbit/s simulée), ≤ 6 s avec cache.
- Aucune frame > 50 ms pendant le chargement d'une tuile en marchant (≤ 1 par minute toléré).
- Tuile L0 moyenne ≤ 600 Ko, maximum ≤ 1,5 Mo (le build échoue sinon).
- Corrections fortes de réconciliation < 5 % des ticks à 150 ms de RTT.
- Le personnage ne traverse aucun mur (test automatisé : 10 000 déplacements aléatoires contre la collision du quartier).

**Risques**

| Risque                                                     | Probabilité | Impact            | Parade                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le semi-réaliste ne tient pas 30 FPS sur GPU intégré (SP1) | **Élevée**  | Rendu à revoir    | Le profil Bas allège : rayon L0 de 200 m, pas d'ombres, échelle de rendu 0,75, imposteurs plus proches ; si SP1 échoue, la machine basse de référence est révisée avec le propriétaire |
| Artiste non recruté                                        | Moyenne     | Kit gris prolongé | Packs d'assets sous licence ; le code ne dépend pas de l'art                                                                                                                           |
| Façades procédurales trop répétitives                      | Moyenne     | Crédibilité       | Variation (teinte, salissure, enseignes), profils par quartier, lieux héros                                                                                                            |

---

### J2 — Tout Yopougon (9 à 11 semaines)

**Objectif démontrable** : le joueur traverse toute la commune à pied (ou en mode debug rapide) du nord au sud, sans trou ni chargement bloquant ; on reconnaît la lagune, les grands axes, la zone industrielle, les quartiers denses ; les lieux héros prioritaires sont en place.

**Livrables** : pipeline sur la commune entière (≈ 2 500 tuiles L0), incrémental et parallèle ; LOD L2/L3 ; relief (MNT) et eau ; heuristiques de hauteur par profil de quartier ; végétation tropicale avec imposteurs ; kit semi-réaliste v1 (≈ 50 modules) ; 4 à 6 lieux héros ; publication de la couche `osm-derived` (ODbL) ; profils de qualité ; carte de la commune dans l'UI.

| ID    | Tâche                                                                                                                                                                                                                                  | Taille | Dépend de    | Couloir |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | ------- |
| J2-01 | Pipeline parallèle (`worker_threads`) et incrémental (cache par hash), exécution sur toute la commune                                                                                                                                  | L      | J1-02..05    | D       |
| J2-02 | Étape `terrain-water` : MNT, lagune, baies, nivellement des routes                                                                                                                                                                     | L      | J2-01        | D       |
| J2-03 | Heuristiques de hauteur par profil de quartier + polygones de quartiers (validés par le PO)                                                                                                                                            | M      | T-018, J2-01 | D + PO  |
| J2-04 | Étape `lod-build` L2/L3 + imposteurs de bâtiments                                                                                                                                                                                      | L      | J1-09        | D + C   |
| J2-05 | Client : streaming multi-niveaux, priorités, gestion de la mémoire GPU par profil                                                                                                                                                      | L      | J1-07, J2-04 | C       |
| J2-06 | Client : origine flottante (rebasage)                                                                                                                                                                                                  | M      | J2-05        | C       |
| J2-07 | Végétation tropicale : 6 à 10 espèces, LOD, imposteurs octaédriques                                                                                                                                                                    | M      | J1-05        | C + art |
| J2-08 | Kit semi-réaliste v1 (≈ 50 modules, 25 matériaux, 100 décalcomanies)                                                                                                                                                                   | L      | SP1          | art + D |
| J2-09 | Lieux héros (4 à 6) et mécanisme de substitution par identifiant OSM                                                                                                                                                                   | M      | J2-08        | art + D |
| J2-10 | SP7 + éclairage nocturne (lampadaires, enseignes émissives, lumières proches)                                                                                                                                                          | M      | J1-14        | C + art |
| J2-11 | Profils de qualité Bas, Moyen, Haut, Mobile (préparé) + mini-benchmark de détection                                                                                                                                                    | M      | J2-05        | C       |
| J2-12 | Carte de la commune (UI) affichant les noms produits par l'étape `naming`                                                                                                                                                              | M      | J2-01, J2-16 | C       |
| J2-13 | Étape `manifest-attribution` + archive ODbL de la couche `osm-derived`                                                                                                                                                                 | S      | J2-01        | D       |
| J2-14 | Rapport de couverture (`report`) et budgets vérifiés sur toutes les tuiles                                                                                                                                                             | S      | J2-01        | D       |
| J2-15 | SP3 (fin) : 500 bots, transferts, rapport                                                                                                                                                                                              | L      | J1-18        | S       |
| J2-16 | **Table de parodie des marques** + étape `naming` (déformation déterministe, distance minimale, contrôle contre les marques et les mots injurieux, surcharges) + **revue humaine** de la liste des grandes marques par le propriétaire | M      | J2-01        | D + PO  |

**Critères d'acceptation mesurables**

- Build complet de la commune **≤ 60 min** sur un poste de développement (8 cœurs), rebuild incrémental après la modification d'une config de quartier ≤ 10 min ; build déterministe (même sha256 du manifeste).
- **100 %** des tuiles respectent les budgets §10.4 ; 0 tuile vide à l'intérieur de la limite communale, hors eau et forêt.
- Traversée nord-sud scriptée : profil Bas ≥ 30 FPS p5, mémoire de l'onglet ≤ 1,5 Go, **0 trou visible** (test de capture automatisé à intervalles réguliers).
- Téléchargement cumulé pour une traversée complète à froid ≤ 250 Mo.
- Archive ODbL publiable générée à chaque release ; attribution présente.

**Risques**

| Risque                                                      | Probabilité | Impact            | Parade                                                                                                                             |
| ----------------------------------------------------------- | ----------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Couverture OSM inégale (quartiers peu ou pas cartographiés) | **Élevée**  | Trous visibles    | Remplissage procédural par l'occupation du sol, jeux d'emprises ouverts (licence validée, ARCHITECTURE §21.3), contributions à OSM |
| Temps de build trop long                                    | Moyenne     | Itérations lentes | Incrémental, parallélisme, build partiel par emprise                                                                               |
| Poids total des tuiles                                      | Moyenne     | Coût CDN, attente | Instances plutôt que maillages, meshopt, budgets bloquants                                                                         |

---

### J3 — Vie quotidienne (10 à 12 semaines, démarre pendant J2 sur le quartier pilote)

**Objectif démontrable** : dans le quartier pilote puis dans toute la commune, un joueur voit ses besoins baisser, mange un garba, se lave, dort sur un banc ou dans une chambre d'auberge, travaille comme serveur au maquis pour un PNJ et gagne des Djai (économie en mémoire derrière l'`EconomyPort`), danse au maquis le soir, joue au foot de quartier contre des bots. Les PNJ répondent en français et en nouchi.

**Livrables** : `sim-needs`, `sim-actions` (conditions, effets, machine à états, registres), `content-schema` et `content-cli` ; ≈ 35 fiches d'actions (vague A) ; 5 métiers PNJ ; PNJ fonctionnels (vendeuse, serveur, coiffeuse) ; foule d'ambiance côté client ; UI du menu d'actions, des besoins et de la progression ; dialogues `content/dialogues` ; intérieurs génériques (maquis, salon, auberge) ; animations de la vague A.

| ID    | Tâche                                                                                                        | Taille | Dépend de    | Couloir |
| ----- | ------------------------------------------------------------------------------------------------------------ | ------ | ------------ | ------- |
| J3-01 | `content-schema` (Zod) : action, job, item, place-type, dialogue, needs + JSON Schema généré                 | M      | T-004        | S       |
| J3-02 | `content-cli validate/compile` : références croisées, clés i18n, paquets compilés par catégorie              | M      | J3-01        | D       |
| J3-03 | `sim-needs` : décroissance par heure de jeu, malus, gel hors ligne                                           | M      | J1-14        | S       |
| J3-04 | `sim-actions` : conditions, registre d'effets, machine à états, interruptions, règlements                    | L      | J3-01        | S       |
| J3-05 | Zone : liaison des actions à l'état du monde, réservation de sites, `EconomyPort` en mémoire                 | L      | J3-04, J1-13 | S       |
| J3-06 | Pipeline `places-sites` : lieux OSM → sites d'action selon `place-types`                                     | M      | J2-01        | D       |
| J3-07 | Client : détection des sites, menu d'actions (aperçu non autoritaire, raisons de refus)                      | M      | J3-04        | C       |
| J3-08 | Client : HUD (besoins, Djai, heure et jour de jeu), progression d'action, notifications i18n                 | M      | T-021        | C       |
| J3-09 | Animations de la vague A (≈ 30 clips) + accessoires attachés                                                 | L      | J1-16        | art + C |
| J3-10 | PNJ fonctionnels (vendeur, serveur, coiffeuse) : comportements simples, dialogues                            | M      | J3-05        | S       |
| J3-11 | Foule d'ambiance déterministe côté client (VAT)                                                              | M      | J1-16        | C       |
| J3-12 | Intérieurs-instances : gabarits maquis, salon, auberge ; transfert vers une instance                         | M      | J3-05        | S + art |
| J3-13 | Rédaction : 35 fiches de la vague A, 5 métiers, horaires « de jeu » (variantes de nuit), dialogues en nouchi | L      | J3-02        | PO      |
| J3-14 | Foot de quartier simplifié (multi-participants, bots)                                                        | M      | J3-05        | S + C   |
| J3-15 | Tests : propriétés de `sim-actions`, idempotence du règlement (`requestId` rejoué)                           | M      | J3-05        | S (QA)  |

**Critères d'acceptation mesurables**

- ≥ 35 actions jouables de bout en bout ; **100 %** des fiches validées par `content-cli` en CI.
- Ajouter une action avec des effets existants = **1 fichier JSON + des clés i18n, 0 ligne de code** (démontré en recette).
- Rejouer un même `requestId` 100 fois en parallèle → **un seul** règlement.
- Une session de 90 min sollicite chaque besoin au moins une fois (test de jeu avec 5 testeurs).
- Pendant la nuit de jeu (19:00 – 06:00), au moins **60 %** des catégories d'actions ont une variante disponible.
- Ellipse : dormir 8 h de jeu prend ≤ 3 min réelles et applique les effets complets.
- Coût CPU serveur des actions et besoins ≤ 2 ms par tick pour 150 joueurs simulés.

**Risques**

| Risque                                                             | Probabilité | Impact            | Parade                                                                                |
| ------------------------------------------------------------------ | ----------- | ----------------- | ------------------------------------------------------------------------------------- |
| Boucle de jeu peu engageante                                       | Moyenne     | Vision fragilisée | Tests de jeu dès la 4e semaine sur le quartier pilote ; équilibrage par le contenu    |
| Volume d'animations                                                | Élevée      | Actions figées    | Clips génériques réutilisés par plusieurs actions ; capture de mouvement sous licence |
| Ratio de temps mal calibré (journées trop courtes ou trop longues) | Moyenne     | Rythme de jeu     | Ratio configurable sans code (ADR 0011), mesuré en tests de jeu                       |

---

### J4 — Transports (8 à 10 semaines)

**Objectif démontrable** : le joueur hèle un taxi qui le conduit d'un bout à l'autre de Yopougon ; prend un woro-woro à une gare ; monte dans un gbaka et dans un bus SOTRA qui suivent leur ligne et leur horaire ; achète une moto, la conduit, fait le plein ; voit un trafic d'ambiance crédible. Le « voyage accéléré » fonctionne.

**Livrables** : `sim-transport` (horaires déterministes, routage A*, tarifs) ; `physics/vehicle` (arcade) ; véhicules de ligne, taxis, véhicules personnels côté zone ; étape `transit` ; contenu des lignes et gares ; trafic d'ambiance côté client ; modèles de véhicules ; UI passager et conducteur.

| ID    | Tâche                                                                                           | Taille | Dépend de    | Couloir |
| ----- | ----------------------------------------------------------------------------------------------- | ------ | ------------ | ------- |
| J4-01 | `sim-transport` : position déterministe des véhicules de ligne, fréquences selon l'heure de jeu | L      | J1-14, J2-01 | S       |
| J4-02 | Routage A* (ALT si besoin) sur le graphe de la commune                                          | M      | J1-02        | S       |
| J4-03 | Étape `transit` + contenu des lignes (gbaka, SOTRA, corridors de woro-woro, gares)              | M      | J2-01        | D + PO  |
| J4-04 | `physics/vehicle` arcade + prédiction et validation serveur                                     | L      | J1-10        | S       |
| J4-05 | Zone : taxis (flotte virtuelle, prise en charge, course, tarif `fare:{rideId}`)                 | M      | J4-02        | S       |
| J4-06 | Zone : embarquement et descente, sièges, voyage accéléré                                        | M      | J4-01        | S       |
| J4-07 | Client : vues des véhicules, caméra conducteur et passager, sons                                | M      | J4-04        | C       |
| J4-08 | Client : trafic d'ambiance déterministe qui cède le passage aux joueurs                         | L      | J1-02        | C       |
| J4-09 | Modèles : taxi, woro-woro, gbaka, bus, 2 motos, 3 voitures                                      | L      | —            | art     |
| J4-10 | Actions de la vague B transport (acheter un ticket, faire le plein, réparer, se garer)          | S      | J3-04        | PO      |
| J4-11 | Streaming adapté à la vitesse (préchargement directionnel)                                      | M      | J2-05        | C       |

**Critères d'acceptation mesurables**

- Position d'un bus calculée par le client et par le serveur : écart ≤ 0,5 m sans réplication.
- Course de taxi de 8 km : prise en charge ≤ 90 s, aucun blocage, tarif débité exactement une fois.
- À 60 km/h, aucune tuile manquante dans le champ de vision ; profil Bas ≥ 30 FPS p5 en conduite.
- Bande passante supplémentaire due aux véhicules de ligne ≈ 0 en régime nominal.

**Risques**

| Risque                           | Probabilité | Impact                    | Parade                                                                                 |
| -------------------------------- | ----------- | ------------------------- | -------------------------------------------------------------------------------------- |
| Données de lignes absentes d'OSM | Élevée      | Lignes à écrire à la main | Contenu écrit par le PO à partir de sources publiques, en commençant par 5 à 10 lignes |
| Conduite instable en réseau      | Moyenne     | Ressenti                  | Modèle arcade simple, prédiction, tolérances adaptées                                  |

---

### J5 — Multijoueur MMO (8 à 10 semaines, couloir S en parallèle de J4)

**Objectif démontrable** : plusieurs joueurs et des centaines de bots partagent la même Yopougon. On traverse une frontière de cellule sans rien remarquer, on voit les autres joueurs près de soi, on discute par chat de proximité, on joue au foot ensemble, et une action à cheval sur deux cellules fonctionne.

**Livrables** : mode `distributed` (passerelles, zones, NATS) ; annuaire des cellules à baux ; fantômes et transferts ; aire d'intérêt avec plafonds et priorités ; réplication delta quantifiée ; reconnexion ; chat de proximité modéré ; `tools/bots` ; tableaux de bord de charge.

| ID    | Tâche                                                                                                                                                    | Taille | Dépend de    | Couloir |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | ------- |
| J5-01 | `@skyline/bus` : implémentation NATS, sujets typés, versionnés et validés                                                                                | M      | J1-18        | S       |
| J5-02 | Annuaire des cellules (JetStream KV, baux), attribution statique par configuration                                                                       | M      | J5-01        | S       |
| J5-03 | Fantômes aux frontières + transferts avec hystérésis                                                                                                     | L      | J5-02        | S       |
| J5-04 | Aire d'intérêt : hachage spatial, plafonds 64/128, débits différenciés                                                                                   | L      | J1-13        | S       |
| J5-05 | Réplication delta quantifiée, base + deltas, abandon des instantanés périmés                                                                             | M      | J5-04        | S       |
| J5-06 | Passerelle : routage dynamique, contre-pression, limitation de débit, compteur de violations                                                             | M      | J5-01        | S       |
| J5-07 | Reconnexion (jeton de reprise, 60 s)                                                                                                                     | M      | J5-06        | S + C   |
| J5-08 | Chat de proximité : filtre FR + nouchi, masquage des numéros et liens, sourdine, blocage, signalement                                                    | M      | J5-06        | S + C   |
| J5-09 | Client : interpolation des entités distantes, étiquettes de noms, émotes                                                                                 | M      | J5-05        | C       |
| J5-10 | `tools/bots` : scénarios (errance, traversées, foule au marché, actions)                                                                                 | M      | J1-12        | S (QA)  |
| J5-11 | Tests de charge et rapport ; tableaux de bord Grafana préparés                                                                                           | M      | J5-10        | S       |
| J5-12 | Actions à plusieurs (discuter, danser, foot) à cheval sur deux cellules                                                                                  | M      | J5-03, J3-05 | S       |
| J5-13 | Horloge partagée multi-zones : publication du segment dans NATS KV `world.clock`, abonnement des zones et passerelles, métrique de dérive NTP et alertes | S      | J5-01, J1-14 | S       |

**Critères d'acceptation mesurables**

- **1 000 bots** répartis sur la commune : tick p95 ≤ 25 ms dans chaque processus de zone (2 vCPU par processus), 0 perte d'entité.
- **150 bots dans une même cellule** : tick p95 ≤ 25 ms ; bande passante descendante ≤ 25 Ko/s par client en p95.
- Transfert de cellule : durée p95 ≤ 100 ms, **0 saut visible** > 0,5 m, 0 entrée perdue.
- Reconnexion dans les 60 s : retour au même état, sans double action ni double paiement.
- Chat : 1 message/s par joueur (rafale de 5), numéros de téléphone masqués (tests).

**Risques**

| Risque                         | Probabilité | Impact                                   | Parade                                                                      |
| ------------------------------ | ----------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Complexité des transferts      | **Élevée**  | Bugs de duplication ou de perte d'entité | SP3 tôt, tests de propriétés sur le protocole, bots de traversée en continu |
| Densité locale extrême         | Moyenne     | Saturation                               | Plafonds d'aire d'intérêt ; couches de cellule en point d'extension         |
| Bibliothèque `ws` insuffisante | Faible      | CPU passerelle                           | Interface `TransportServer` : uWebSockets.js en remplacement                |

---

### J6 — Économie, propriété, commerces, persistance (10 à 12 semaines)

**Objectif démontrable** : un joueur crée son profil **invité** sans inscription, récupère son code de récupération et retrouve son profil sur un autre navigateur ; il loue une chambre, paie son loyer d'avance, puis achète une maison ; il ouvre un maquis dans un local commercial, se réapprovisionne chez le grossiste, fixe ses prix, embauche un autre joueur qui sert les clients et reçoit son salaire depuis le séquestre. Tout survit à un redémarrage complet des serveurs.

**Livrables** : `packages/db` (schéma ARCHITECTURE §19, migrations) ; `apps/services` : modules `accounts` (invité, code de récupération, `CredentialProvider`), `session-tickets`, `characters` (chargement, points de sauvegarde), `economy` (grand livre, idempotence, plafonds), `property` (baux, titres), `business` (stock, prix bornés, caisse, contrats, séquestre), `place-names` (liste noire, retraits), `privacy` (export, suppression), `moderation` ; adaptateurs NATS des ports ; UI logement, commerce et emploi ; actions de la vague B.

| ID    | Tâche                                                                                                                                                    | Taille | Dépend de           | Couloir    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------- | ---------- |
| J6-01 | `packages/db` : schéma + migrations (**accord du propriétaire requis**)                                                                                  | M      | —                   | S          |
| J6-02 | `accounts` : profil invité, jeton d'appareil haché, code de récupération, restauration limitée, `CredentialProvider`                                     | M      | J6-01               | S          |
| J6-03 | `session-tickets` + vérification par la passerelle                                                                                                       | S      | J6-02               | S          |
| J6-04 | `characters` : chargement, points de sauvegarde toutes les 60 s, concurrence optimiste                                                                   | M      | J6-01               | S          |
| J6-05 | `economy` : grand livre, `commit` idempotent, verrous ordonnés, plafonds, opérations de stock                                                            | L      | J6-01               | S          |
| J6-06 | Tests de concurrence et de propriétés du grand livre (même clé ×100, somme nulle, solde ≥ 0)                                                             | M      | J6-05               | S (QA)     |
| J6-07 | `property` : biens dérivés, baux (avance, préavis), titres, revente au système                                                                           | L      | J6-05, J3-06        | S          |
| J6-08 | `business` : ouverture, stock, prix bornés, caisse, retraits, fermeture                                                                                  | L      | J6-05, J6-07        | S          |
| J6-09 | Contrats d'emploi entre joueurs + séquestre des salaires + anti-boucles                                                                                  | L      | J6-08               | S          |
| J6-10 | Zone : actions de vente dans un commerce de joueur (rôle `vendor` tenu par un employé ou un PNJ gérant)                                                  | M      | J6-08, J3-05        | S          |
| J6-11 | Retraits de noms sur demande : formulaire (mentions légales), journal `place_name_takedown`, surcharge + rebuild incrémental de l'étape `naming`         | M      | J2-16               | S + D + PO |
| J6-12 | `privacy` : export JSON, suppression différée, anonymisation du grand livre ; rétention                                                                  | M      | J6-02               | S          |
| J6-13 | Client : écrans invité, code de récupération, logement, gestion de commerce, offres d'emploi, caisse                                                     | L      | J6-02..09           | C          |
| J6-14 | Contenu : `content/housing`, `content/businesses` (maquis, boutique : articles, fourchettes de prix), actions de la vague B                              | M      | J3-02               | PO         |
| J6-15 | Instances de logement (accès bail ou titre, invités présents)                                                                                            | M      | J3-12, J6-07        | S          |
| J6-16 | Tableau de bord économique (masse monétaire, sources, puits, commerces)                                                                                  | S      | J6-05               | S          |
| J6-17 | Échéances récurrentes en temps de jeu (loyers, PNJ gérants) exécutées par le service, idempotentes, rattrapées au redémarrage ; règle hors ligne (§16.1) | M      | J6-07, J6-08, J5-13 | S          |

**Critères d'acceptation mesurables**

- Redémarrage complet (tous processus) : **0 Djai perdu ni créé** (somme du grand livre identique), ≤ 60 s de perte d'état non monétaire.
- `commit` : p95 ≤ 20 ms en charge nominale ; 100 requêtes concurrentes avec la même clé → 1 écriture ; 1 000 transactions aléatoires → invariants respectés (test de propriétés).
- Vente en commerce de joueur : débit, crédit de la caisse et décrément du stock **atomiques** (test d'injection de panne entre chaque étape → rien n'est appliqué).
- Salaire d'un employé : versé exactement une fois par service validé ; service abandonné → remboursé à la caisse.
- Restauration par code : fonctionne sur un autre navigateur ; 10 essais erronés → verrouillage progressif.
- Export et suppression d'un profil fonctionnels de bout en bout.
- Règle hors ligne : profil absent 3 jours réels avec un loyer d'avance insuffisant → échéances prélevées ou notées impayées, **bail conservé** jusqu'au préavis de 7 jours réels ; besoins identiques à la reconnexion ; aucun salaire versé hors service.

**Risques**

| Risque                                          | Probabilité | Impact                                 | Parade                                                                                            |
| ----------------------------------------------- | ----------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Exploits économiques (boucles, prix, salaires)  | **Élevée**  | Inflation, triche                      | Plafonds, prix bornés, séquestre, détection, tableau de bord ; bêta fermée d'abord                |
| Perte du code de récupération                   | Élevée      | Joueurs qui perdent maison et commerce | Rappels dans l'UI ; extension compte permanent priorisée après la bêta si le problème se confirme |
| Charge du périmètre commerces (+6 à 8 semaines) | Certaine    | Délai                                  | Deux types seulement, modèle générique (ARCHITECTURE §3.8)                                        |

---

### J7 — Polish, performance, prêt pour le mobile, bêta fermée (6 à 8 semaines)

**Objectif démontrable** : une bêta fermée de 100 à 300 testeurs (palier P1 d'hébergement) est **prête à être déployée** par le propriétaire : profils de qualité réglés, accessibilité, modération opérationnelle, observabilité, documents légaux, artefacts de déploiement.

**Livrables** : passe de performance sur toutes les machines de référence ; accessibilité ; profil Mobile vérifié sur un smartphone de milieu de gamme (sans contrôles tactiles) ; outils de modération (traitement des signalements, sanctions) ; observabilité complète ; CGU, politique de confidentialité, mentions légales (dont noms de lieux et retrait) ; dossier préparatoire ARTCI ; Dockerfiles, Compose et runbooks ; actions de la vague C prioritaires ; contenu final de la bêta.

| ID    | Tâche                                                                                                     | Taille | Dépend de | Couloir |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ | --------- | ------- |
| J7-01 | Passe de performance (profilage, budgets, régressions)                                                    | L      | —         | C       |
| J7-02 | Accessibilité (contraste, tailles, clavier) + UI responsive vérifiée                                      | M      | —         | C       |
| J7-03 | Profil Mobile : mesures sur un appareil de milieu de gamme, mémoire, KTX2 ASTC/ETC2                       | M      | J2-11     | C       |
| J7-04 | Outils de modération (file de signalements, sanctions, journal)                                           | M      | J5-08     | S       |
| J7-05 | Observabilité : alertes, tableaux de bord, télémétrie client avec consentement                            | M      | —         | S       |
| J7-06 | Documents légaux + dossier ARTCI + revue juridique (externe)                                              | M      | —         | PO      |
| J7-07 | Artefacts de déploiement P0/P1 (Dockerfiles, Compose, sauvegardes, runbooks) — **préparés, non exécutés** | M      | —         | S       |
| J7-08 | Lieux héros restants, finitions artistiques, sons d'ambiance                                              | L      | —         | art     |
| J7-09 | Vague C prioritaire + équilibrage (économie, besoins, salaires)                                           | M      | J6        | PO + S  |
| J7-10 | Recette complète + test de charge final (1 000 bots + 20 humains)                                         | M      | tout      | QA      |

**Critères d'acceptation mesurables**

- Profil Bas ≥ 30 FPS p5, Moyen ≥ 60 FPS médiane, sur tout le parcours de recette.
- Premier rendu jouable ≤ 15 s à froid, ≤ 6 s avec cache.
- 0 vulnérabilité critique ou haute ouverte (revue de l'agent Sécurité) ; 0 PII dans les logs (contrôle automatisé).
- Signalement traité de bout en bout en recette ; retrait d'un nom appliqué par rebuild incrémental de l'étape `naming` en ≤ 15 min, cache client invalidé.
- Déploiement de bout en bout sur une VM vierge reproductible à partir des runbooks (exécuté par le propriétaire).

**Risques** : dette accumulée sur les jalons précédents (prévoir 20 % de J7 pour la corriger) ; retour juridique tardif (lancer J7-06 dès J5).

---

## 5. Après la bêta

### v2-A — Extension à Abidjan

- Une commune supplémentaire = `tools/map-pipeline/config/<commune>.pipeline.json` + profils de quartiers + contenu (lieux, lignes) + lieux héros. **Aucun changement de code attendu** : grille UTM commune et annuaire de cellules sans limite (ARCHITECTURE §25).
- Ordre suggéré : Attécoubé et Abobo (contiguës), puis le Plateau et Adjamé (centre, gares), Cocody, Treichville, Marcory, Koumassi, Port-Bouët (aéroport → mode `air`).
- Durée indicative : 6 à 8 semaines pour la première (validation du processus et liaisons entre communes : lignes de gbaka intercommunales), puis 3 à 5 semaines par commune.
- Risque : coût d'hébergement et poids des tuiles proportionnels à la surface ; la couverture OSM varie selon les communes.

### v2-B — Combat, missions, police

- S'appuie sur les points d'extension existants (registres d'effets et de conditions, `extensions.legality`, `missionHooks`, vues privées, historique de positions, trafic à synchroniser).
- **Règle préalable** (ADR 0010) : aucun événement négatif ciblant un commerce identifiable ; les lieux de culte restent des sanctuaires.
- Durée indicative : 4 à 6 mois, ADR dédiée obligatoire avant de démarrer.

### Autres extensions identifiées

Compte permanent (si la perte de codes de récupération pose problème en bêta, ADR 0012) ; téléphone en jeu et messagerie privée ; vente et location entre joueurs ; autres types de commerces ; contrôles tactiles et PWA ; WebTransport ; mini-jeux (damier, ludo, awalé).

---

## 6. Risques majeurs transverses

| #   | Risque                                                                                           | Probabilité | Impact | Parade                                                                                                                                            | Jalon      |
| --- | ------------------------------------------------------------------------------------------------ | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| R1  | Semi-réaliste intenable sur PC modeste ou faute d'artiste                                        | Élevée      | Élevé  | SP1 dès J1 ; art en données ; artiste freelance (Q1) ; profil Bas agressif                                                                        | J1, J2     |
| R2  | Complexité MMO (transferts, densité)                                                             | Élevée      | Élevé  | SP3 dès J1 ; bots en continu ; plafonds de densité                                                                                                | J1 → J5    |
| R3  | Exploits économiques (commerces, salaires, transferts)                                           | Élevée      | Élevé  | Grand livre, idempotence, prix bornés, séquestre, plafonds, bêta fermée                                                                           | J6         |
| R4  | Couverture OSM inégale                                                                           | Élevée      | Moyen  | SP2 ; remplissage procédural ; sources ouvertes complémentaires                                                                                   | J0, J2     |
| R5  | Risque juridique des marques parodiées (risque de confusion)                                     | Moyenne     | Élevé  | Déformation forte et déterministe, aucune charte graphique, revue humaine, retrait sur demande, revue juridique avant la bêta publique (ADR 0010) | J2, J6, J7 |
| R6  | Rythme de l'horloge interne et règle hors ligne mal calibrés (loyers qui pénalisent les absents) | Moyenne     | Moyen  | Ratio configurable, préavis en jours réels, mesures en bêta (ADR 0011)                                                                            | J3, J6, J7 |
| R7  | Capacité de l'équipe (2,5 ETP pour un MMO 3D)                                                    | Élevée      | Élevé  | Chevauchements, découpage strict, YAGNI sur les extensions                                                                                        | Tous       |
| R8  | Conformité données (ARTCI, transfert hors CI)                                                    | Moyenne     | Élevé  | Dossier préparé en J7, décision d'hébergement après SP4                                                                                           | J0, J7     |
