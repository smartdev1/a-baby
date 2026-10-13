# Règles du développeur BACKEND (et de son agent Claude)

> S'applique quand `.claude/role.local` contient `backend` (ou `SKYLINE_ROLE=backend`).
> Le hook `.claude/hooks/enforce-role.mjs` **bloque** toute modification hors de ce périmètre.

## 1. Mission

Tout ce qui fait **exister et tourner le monde** : pipeline carte OSM → tuiles de Yopougon, simulation autoritaire (cellules, déplacements, actions, besoins, transports, PNJ), passerelle WebSocket, services (comptes invités, économie Djai, logement, commerces, horloge interne, modération, vie privée), base de données, bus, observabilité et contrats partagés.

## 2. Périmètre

| Peut modifier                                                                                                                        | Peut lire, ne modifie pas (demande au frontend) | Ne touche jamais                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/gateway/**`, `apps/zone/**`, `apps/services/**`                                                                                | `apps/web/**`                                   | `assets-src/`, `tools/asset-pipeline`                                                          |
| `packages/{geo,tile-format,protocol,physics,content-schema,sim-*,economy-rules,business-rules,bus,observability,db}/**`              | `packages/i18n`                                 | `content/i18n`, `content/dialogues`, `content/appearance`, `content/interiors`                 |
| `tools/{map-pipeline,content-cli,bots}/**`                                                                                           |                                                 | `CLAUDE.md`, `ARCHITECTURE.md`, `docs/adr`, `docs/rules`, `.claude/` (propriétaire uniquement) |
| `content/{actions,jobs,items,place-types,transport,needs,housing,businesses,place-names,game-config}/**`                             |                                                 |                                                                                                |
| `data/**`, `infra/**` (préparé, **jamais exécuté** par l'agent), `tests/{integration,load}/**`                                       |                                                 |                                                                                                |
| Partagé : `docs/backlog`, `docs/spikes`, `docs/runbooks`, `tools/repo-checks`, configs racine (relecture de l'autre dev obligatoire) |                                                 |                                                                                                |

**Contrats partagés** (`protocol`, `tile-format`, `physics`, `content-schema`, `geo`) : le backend en est propriétaire, mais **tout changement est relu par le frontend**, qui les consomme. Un changement incompatible incrémente `protocolVersion`.

## 3. Règles techniques non négociables

1. **Serveur autoritaire** : le client n'envoie que des intentions ; chaque déplacement, action, achat est validé côté serveur.
2. **Logique métier dans des paquets purs** (`packages/sim-*`, `economy-rules`, `business-rules`), testés unitairement ; `apps/zone` ne fait qu'orchestrer.
3. **`apps/zone` n'importe jamais `@skyline/db`** ; seul `apps/services` y accède (vérifié par dependency-cruiser).
4. **Économie** : toute écriture de Djai passe par `EconomyPort.commit` → grand livre en partie double, clé d'idempotence unique, `balance >= 0`, verrous triés ; tests de propriété + concurrence (même clé ×100 → une seule écriture). Aucun `UPDATE balance` hors du module `economy`.
5. **Validation** de toute entrée (HTTP, WebSocket, bus, contenu, tuiles) par schéma Zod ou codec binaire borné.
6. **Déterminisme** : pas de `Math.random` dans le pipeline ni dans `sim-*` (`SeededRng`, graines dérivées des identifiants OSM). Le test golden sur `pigeons-sample.geojson` reste vert.
7. **Temps** : toute règle horaire passe par `@skyline/sim-clock` (horloge interne du monde) ; jamais `Date.now()` dans une règle de jeu.
8. **Sécurité** : routes mutantes authentifiées et limitées en débit ; jeton d'appareil invité ≥ 128 bits stocké haché ; aucun secret dans le code, les logs ou les commits ; **aucune donnée personnelle dans les logs**.
9. **ODbL** : couches `osm-derived` et `game-authored` séparées ; attribution conservée ; noms de marques/commerces produits par l'étape `naming` (parodies, revue humaine de la table des grandes marques).
10. **Observabilité** : logs pino via `@skyline/observability`, `/health` et `/ready`, métriques de tick et de bande passante.
11. **Modes `all-in-one` et `distributed`** : le code métier ignore dans lequel il tourne (bus en mémoire en dev/test, NATS à partir de J5).
12. **Migrations, dépendances, Docker, CI, `.env`** : accord explicite du propriétaire à chaque fois.

## 4. Règles de code (communes, rappel)

- **Chaque fichier commence par un en-tête** `Role:` (+ `Owner:`) ; **chaque dossier a un `README.md`** (contrôlé par `pnpm lint`).
- Fichiers ≤ 400 lignes (cible 250), fonctions ≤ 80 lignes, complexité ≤ 12, ≤ 4 paramètres, ≤ 12 fichiers source par dossier.
- Interdits : `utils`, `helpers`, `common`, `misc`, `core`, `*Manager`, `any`, promesses flottantes, imports profonds, cycles, `main.ts` > 60 lignes.
- Erreurs typées (`Result<T, E>` pour le métier), aucun `catch` vide ; unités dans les noms (`*Ms`, `*GameMin`, Djai en `bigint`).
- Modules de `apps/services/src/modules/X` : `api/`, `application/`, `domain/`, `infra/`, `bus/` ; un module n'importe jamais l'`infra/` d'un autre.

## 5. Flux de travail

1. Prendre une tâche `owner: backend` dans `docs/backlog/` → statut `doing` (max 2 tâches en cours dans l'équipe).
2. Branche `feat/T-xxx-titre` → code + tests + README du dossier à jour.
3. `pnpm lint && pnpm typecheck && pnpm test` doivent passer.
4. PR (< 400 lignes modifiées) → **relue par le développeur frontend** → fusion par le propriétaire.
5. Commits en anglais (Conventional Commits), **sans ligne de co-auteur Claude**.

## 6. Skills utiles

`new-module` (créer un dossier/paquet/fichier conforme). Pour les tuiles et le format de collision, se référer à ARCHITECTURE §10–§11.
