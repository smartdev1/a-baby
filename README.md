# SkyLine — Yopougon

**Vision en 5 lignes** : Simulation de vie virtuelle dans la commune entière de Yopougon (Abidjan) à l'échelle réelle 1:1 depuis OpenStreetMap. Les joueurs y travaillent, se logent, ouvrent des commerces, utilisent les transports en commun et vivent une vie quotidienne authentique dans un monde persistant et extensible. Français (locale `fr-CI`) avec du nouchi, i18n dès le départ, économie idempotente en Djai.

**Prérequis** :

- Node.js 24 (`.nvmrc`) — `nvm install 24 && nvm use 24` (ou nvm-windows)
- pnpm — `npm i -g pnpm`
- Docker Desktop — pour PostgreSQL, NATS et les outils pipeline (J1/J6)
- Pour le travail 3D : Blender ≥ 4, KTX-Software (`toktx`), Git LFS

**Commandes utiles** :

- `pnpm install` — installer toutes les dépendances
- `pnpm dev` — lancer le client web sur http://localhost:5173 (visionneuse blockout temporaire)
- `pnpm dev:services` — lancer les HTTP services sur http://127.0.0.1:8080/health
- `pnpm map:build` — construire la carte OSM → tuiles (CLI pipeline)
- `pnpm verify` — passer toutes les gates : lint + typecheck + test
- `pnpm lint` — ESLint + dependency-cruiser + checks de layout
- `pnpm typecheck` — TypeScript strict sur tous les paquets
- `pnpm test` — exécuter les tests Vitest
- `pnpm check:repo` — checks de repo automatisés

**Liens vers documentation** :

- `ARCHITECTURE.md` — Architecture complète, principes, stack et justifyations
- `docs/roadmap.md` — Roadmap J0 → J7, jalons et dépendances
- `docs/adr/` — Décisions d'architecture (ADR 0001 à 0012+)
- `docs/rules/` — Règles par rôle (FRONTEND.md, BACKEND.md)
- `ATTRIBUTION.md` — Attribution OpenStreetMap (ODbL)
- `docs/cartographie-projet.md` — Photographie du projet au 13/10/2026

**Attribution OSM** : Les données cartographiques proviennent d'OpenStreetMap (ODbL). Voir `ATTRIBUTION.md` pour les mentions légales complètes. Les noms de lieux publics conservent leur nom OSM ; les marques et commerces portent des noms parodiques (ex. « Orange » → « Oronge », « MTN » → « MTM ») selon la table de correspondance `content/place-names/brand-parodies.json`, revue humainement avant chaque release.
