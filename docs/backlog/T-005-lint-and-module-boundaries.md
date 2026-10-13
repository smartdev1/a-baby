---
id: T-005
title: ESLint, Prettier, modularity rules and dependency-cruiser boundaries
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: M
---

## Context
Le propriétaire exige un code modulaire sans fichier fourre-tout. Les règles de ARCHITECTURE §9 ne valent que si elles sont outillées (ADR 0007).

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-004.

## User story
En tant que relecteur, je veux que les violations de modularité soient détectées automatiquement afin de ne pas les traquer à la main en revue.

## Acceptance criteria
- [ ] Given `eslint.config.js` (flat config + typescript-eslint), Then sont actives : `max-lines` 400 (hors tests 600, hors fichiers générés), `max-lines-per-function` 80, `complexity` 12, `max-params` 4, `@typescript-eslint/no-explicit-any`, `no-floating-promises`, et l'interdiction des noms de fichiers `utils|helpers|common|misc|stuff|core`.
- [ ] Given `.dependency-cruiser.cjs`, Then il encode la matrice de ARCHITECTURE §9.3 (paquets purs sans DOM, Node ni Babylon ; `apps/zone` n'importe jamais `@skyline/db` ; aucun import profond ; aucun cycle).
- [ ] Given une violation volontaire dans une branche de test (ex. `apps/zone` importe `@skyline/db`), When on lance `pnpm lint`, Then la commande échoue avec un message explicite.
- [ ] Given Prettier et `.gitattributes` (LF), Then `pnpm format:check` passe sur le dépôt.
- [ ] Given un script `check:folder-size`, Then il échoue si un dossier contient plus de 12 fichiers source.

## Out of scope
- Corriger le code legacy qui disparaîtra (exclusion temporaire documentée dans `docs/tech-debt.md`).

## Technical notes
Ajout de dépendances de développement (eslint, typescript-eslint, prettier, dependency-cruiser) : accord du propriétaire requis. Réf. ARCHITECTURE §9, ADR 0007.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
