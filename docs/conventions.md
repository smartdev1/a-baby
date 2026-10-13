# Conventions

The authoritative rules are in `ARCHITECTURE.md` §9 (modularity) and §27 (code conventions), and in `docs/rules/` per role. These reference ARCHITECTURE sections without duplicating their content.

## §9 — Règles de modularité (ARCHITECTURE.md §9)

| Règle                                                      | Seuil                                                            | Outil                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| Lignes par fichier source (hors tests et fichiers générés) | cible ≤ 250 ; **erreur à 400**                                   | ESLint `max-lines`        |
| Lignes par fichier de test                                 | erreur à 600                                                     | ESLint                    |
| Lignes par fonction                                        | avertissement à 50 ; **erreur à 80**                             | `max-lines-per-function`  |
| Complexité cyclomatique                                    | erreur à 12                                                      | `complexity`              |
| Paramètres par fonction                                    | 4 maximum (au-delà, un objet typé)                               | `max-params`              |
| Dépendances injectées par classe                           | 6 maximum (au-delà, découper)                                    | revue                     |
| Fichiers source par dossier                                | 12 maximum (au-delà, sous-dossiers par concept)                  | script CI                 |
| `main.ts` de chaque app                                    | **≤ 60 lignes** : composition uniquement, aucune logique         | revue + `max-lines` dédié |
| Fichier de données versionné                               | ≤ 1 Mo (fixtures de test) ; aucune sortie du pipeline versionnée | hook pre-commit + CI      |
| Fichier de contenu                                         | **une définition par fichier** (`content/**`)                    | content-cli               |

### 9.2. Interdits

- Noms de fichiers ou de modules fourre-tout : `utils`, `helpers`, `common`, `misc`, `shared` (dans un paquet), `stuff`, `core.ts`, `types.ts` de plus de 150 lignes, `*Manager` générique (`GameManager`, `WorldManager`).
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

| Depuis \ vers                                                                                                                         | paquets **[pur]**      | `bus`, `observability` | `db`  | `@babylonjs/*`, `preact` | API Node (`fs`, `net`…)                     | autres `apps/*` |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------- | ----- | ------------------------ | ------------------------------------------- | --------------- |
| paquets **[pur]** (`geo`, `tile-format`, `protocol`, `physics`, `content-schema`, `sim-*`, `economy-rules`, `business-rules`, `i18n`) | ✔ (sans cycle) + `zod` | ✘                      | ✘     | ✘                        | ✘ (`lib` ES2023 uniquement, ni DOM ni Node) | ✘               |
| `bus`, `observability`                                                                                                                | ✔                      | ✔                      | ✘     | ✘                        | ✔                                           | ✘               |
| `db`                                                                                                                                  | ✘                      | ✘                      | —     | ✘                        | ✔                                           | ✘               |
| `apps/web`                                                                                                                            | ✔                      | ✘                      | ✘     | ✔                        | ✘                                           | ✘               |
| `apps/gateway`                                                                                                                        | `protocol`, `geo`      | ✔                      | ✘     | ✘                        | ✔                                           | ✘               |
| `apps/zone`                                                                                                                           | ✔                      | ✔                      | **✘** | ✘                        | ✔                                           | ✘               |
| `apps/services`                                                                                                                       | ✔                      | ✔                      | ✔     | ✘                        | ✔                                           | ✘               |
| `tools/*`                                                                                                                             | ✔                      | `observability`        | ✘     | ✘                        | ✔                                           | ✘               |

Au sein d'une app, la même logique s'applique : `apps/web/src/world-render` n'importe pas `ui`, `ui` n'importe pas `world-render` ; ils communiquent par des stores (signals) exposés par `app/`. Dans `apps/services/src/modules/X`, un module n'importe jamais `infra/` d'un autre module, seulement son `application/` public.

### 9.4. Ajout d'un paquet ou d'une dépendance

Un nouveau paquet exige une ligne dans la matrice §9.3 et une justification dans la PR. Une nouvelle dépendance npm exige l'accord du propriétaire (CLAUDE.md) ainsi qu'une vérification de licence (pas de GPL ni d'AGPL dans le client ni dans les serveurs ; MIT, BSD, Apache-2.0 et ISC acceptées).

## §27 — Conventions de code

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

## Tooling examples

- `pnpm verify` — lint (ESLint + dependency-cruiser + repo checks) + typecheck + tests, as in CI.
- `pnpm test:coverage` — coverage report; pure packages with code must keep ≥ 85 % lines (thresholds in `vitest.config.ts`).
- Property test model (fast-check): `packages/geo/src/utm-projection.test.ts` (10 000-run round trip) and `packages/tile-format/src/collision/collision-codec.test.ts` (round trip + 10 000-case fuzz).
- Golden test model: `tools/map-pipeline/src/stages/pipeline-golden.test.ts` (`UPDATE_GOLDEN=1` to accept an intended change).
