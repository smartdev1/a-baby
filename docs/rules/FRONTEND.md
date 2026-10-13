# Règles du développeur FRONTEND (et de son agent Claude)

> S'applique quand `.claude/role.local` contient `frontend` (ou `SKYLINE_ROLE=frontend`).
> Le hook `.claude/hooks/enforce-role.mjs` **bloque** toute modification hors de ce périmètre.

## 1. Mission

Tout ce que le joueur **voit, entend et touche** : rendu 3D semi-réaliste de Yopougon, streaming des tuiles, avatar et caméra 3e personne, interface (HUD, menus, chat, commerce, logement), audio, textes et dialogues (français + nouchi), et production des assets 3D (Blender → glTF → `tools/asset-pipeline`).

## 2. Périmètre

| Peut modifier                                                                                                       | Peut lire, ne modifie pas (demande au backend)                                                                               | Ne touche jamais                                                                               |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/web/**`                                                                                                       | `packages/protocol`, `packages/tile-format`, `packages/physics`, `packages/geo`, `packages/content-schema`, `packages/sim-*` | `apps/gateway`, `apps/zone`, `apps/services`                                                   |
| `assets-src/**`, `tools/asset-pipeline/**`                                                                          | `content/actions`, `content/place-types`, `content/transport`…                                                               | `packages/db`, `packages/bus`, `packages/observability`                                        |
| `packages/i18n/**`                                                                                                  | `ARCHITECTURE.md`, `docs/adr/`                                                                                               | `infra/`, `data/`, `tools/map-pipeline`                                                        |
| `content/i18n/**`, `content/dialogues/**`, `content/appearance/**`, `content/interiors/**`                          |                                                                                                                              | `CLAUDE.md`, `ARCHITECTURE.md`, `docs/adr`, `docs/rules`, `.claude/` (propriétaire uniquement) |
| `tests/e2e/**`                                                                                                      |                                                                                                                              |                                                                                                |
| Partagé : `docs/backlog`, `docs/spikes`, `tools/repo-checks`, configs racine (relecture de l'autre dev obligatoire) |                                                                                                                              |                                                                                                |

**Besoin d'un changement côté backend** (nouveau message réseau, champ de tuile, règle) : l'agent **n'écrit pas** le code. Il rédige une note de besoin dans la tâche (`docs/backlog/T-xxx`, section _Technical notes_) avec le contrat souhaité, et le développeur backend l'implémente.

## 3. Règles techniques non négociables

1. **Le client ne décide rien** : aucun gain, coût, solde, résultat d'action ou inventaire calculé côté client. Il affiche ce que le serveur annonce ; la prédiction ne concerne que le déplacement (via `@skyline/physics`).
2. **Babylon en modules ES** : `import { X } from '@babylonjs/core/…/x'`, jamais `import * as BABYLON` ni le paquet `babylonjs`.
3. **UI en Preact + signals** (HTML/CSS). Babylon GUI seulement pour les étiquettes dans le monde 3D.
4. **`world-render/` et `ui/` ne s'importent jamais** l'un l'autre : ils communiquent via des stores exposés par `app/`.
5. **Aucun texte joueur en dur** : clés i18n `domaine.sous_domaine.cle` dans `content/i18n/fr-CI/`. Nouchi uniquement dans les dialogues de PNJ, relus par le propriétaire.
6. **Heure du jeu** : toujours celle de l'horloge interne du serveur (`@skyline/sim-clock`), jamais `Date.now()` pour une règle ou l'éclairage.
7. **Noms de lieux** : uniquement ceux des métadonnées de tuile (étape `naming`) ; marques parodiées, **aucun logo ni charte graphique réels**, texte toujours échappé.
8. **Attribution OpenStreetMap** visible (chargement, carte, crédits) : jamais retirée.
9. **Performance mesurée** : ≥ 30 FPS sur la machine de référence basse ; toute PR qui touche au rendu ou au streaming joint une mesure (FPS p5, draw calls, mémoire GPU). Régression > 10 % refusée.
10. **Assets 3D** : nommage `categorie_nom_variante_lod`, 1 unité = 1 m, pivot au sol, LOD, textures KTX2, budget de triangles respecté ; passage obligatoire par `tools/asset-pipeline` ; licence inscrite au registre d'assets.
11. **Accessibilité** : contraste AA, navigation clavier, cibles ≥ 44 px (préparation mobile), aucune info portée seulement par la couleur.

## 4. Règles de code (communes, rappel)

- **Chaque fichier commence par un en-tête** `Role:` (+ `Owner:`) ; **chaque dossier a un `README.md`** (contrôlé par `pnpm lint`).
- Fichiers ≤ 400 lignes (cible 250), fonctions ≤ 80 lignes, complexité ≤ 12, ≤ 4 paramètres, ≤ 12 fichiers source par dossier.
- Interdits : `utils`, `helpers`, `common`, `misc`, `core`, `*Manager`, `any`, promesses flottantes, imports profonds dans un autre paquet, `main.ts` > 60 lignes.
- Tests à côté du code (`*.test.ts`), nommés « should … when … ».

## 5. Flux de travail

1. Prendre une tâche `owner: frontend` dans `docs/backlog/` → statut `doing` (max 2 tâches en cours dans l'équipe).
2. Branche `feat/T-xxx-titre` → code + tests + README du dossier à jour.
3. `pnpm lint && pnpm typecheck && pnpm test` doivent passer ; `pnpm dev` pour vérifier en jeu.
4. PR (< 400 lignes modifiées) → **relue par le développeur backend** → fusion par le propriétaire.
5. Commits en anglais (Conventional Commits), **sans ligne de co-auteur Claude**.

## 6. Skills utiles

`babylon-rendering` (règles de rendu et de perf), `3d-asset-pipeline` (Blender → glTF → KTX2/meshopt), `new-module` (créer un dossier ou un fichier conforme).
