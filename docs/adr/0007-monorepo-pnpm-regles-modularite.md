# ADR 0007 — Monorepo pnpm et règles de modularité outillées

- **Statut** : Proposée
- **Date** : 13/10/2026

## Contexte

Le propriétaire exige un code modulaire, **sans fichier fourre-tout** (pas de god-file, pas de `world.json` monolithique, pas de `main.ts` qui fait tout). L'existant a deux lockfiles, des dépendances fantômes, des doublons de configuration, des barrels cassés et une dépendance circulaire. L'équipe travaille sous Windows et sous Linux.

## Décision

1. **pnpm workspaces** (lockfile unique, `node_modules` strict qui rejette les dépendances non déclarées), Node 24 LTS.
2. **Paquets purs** (`geo`, `tile-format`, `protocol`, `physics`, `content-schema`, `sim-*`, `economy-rules`, `business-rules`, `i18n`) sans DOM ni API Node ; **apps** (`web`, `gateway`, `zone`, `services`) ; **tools** (`map-pipeline`, `content-cli`, `asset-pipeline`, `bots`).
3. **Matrice de dépendances** (ARCHITECTURE §9.3) vérifiée par **dependency-cruiser** en CI ; aucun import profond ; seul `src/index.ts` d'un paquet ré-exporte ; aucun cycle.
4. **Seuils ESLint** : fichier ≤ 400 lignes (cible 250), fonction ≤ 80 lignes, complexité ≤ 12, 4 paramètres au plus, `main.ts` ≤ 60 lignes, pas de `any`. **Noms interdits** : `utils`, `helpers`, `common`, `misc`, `*Manager` générique. 12 fichiers source au plus par dossier.
5. **Données** : une définition par fichier dans `content/` ; aucune sortie du pipeline versionnée ; fichier de données versionné ≤ 1 Mo.
6. **Multiplateforme** : scripts en Node (pas de bash dans `package.json`), `.gitattributes` en LF, aucun chemin absolu.

## Alternatives écartées

| Option                        | Raison du rejet                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Rester sur npm workspaces     | Dépendances fantômes, double lockfile constaté                                                |
| Nx ou Turborepo               | Puissants mais surdimensionnés pour 3 développeurs ; dependency-cruiser couvre les frontières |
| Règles uniquement documentées | Non tenues dans la durée sans outillage                                                       |

## Conséquences

- Les violations sont détectées en CI, pas en revue.
- L'ajout d'un paquet exige une ligne dans la matrice et une justification.
- Coût initial (T-003 à T-007) d'environ 2 semaines-personne en J0.
