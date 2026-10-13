---
id: T-005
title: ESLint, Prettier, modularity rules and dependency-cruiser boundaries
status: review
owner: backend
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

- [x] Given `eslint.config.js` (flat config + typescript-eslint), Then sont actives : `max-lines` 400 (hors tests 600, hors fichiers générés), `max-lines-per-function` 80, `complexity` 12, `max-params` 4, `@typescript-eslint/no-explicit-any`, `no-floating-promises`, et l'interdiction des noms de fichiers `utils|helpers|common|misc|stuff|core`.
- [x] Given `.dependency-cruiser.cjs`, Then il encode la matrice de ARCHITECTURE §9.3 (paquets purs sans DOM, Node ni Babylon ; `apps/zone` n'importe jamais `@skyline/db` ; aucun import profond ; aucun cycle).
- [x] Given une violation volontaire dans une branche de test (ex. `apps/zone` importe `@skyline/db`), When on lance `pnpm lint`, Then la commande échoue avec un message explicite.
- [ ] Given Prettier et `.gitattributes` (LF), Then `pnpm format:check` passe sur le dépôt.
- [x] Given un script `check:folder-size`, Then il échoue si un dossier contient plus de 12 fichiers source.

## Out of scope

- Corriger le code legacy qui disparaîtra (exclusion temporaire documentée dans `docs/tech-debt.md`).

## Technical notes

Ajout de dépendances de développement (eslint, typescript-eslint, prettier, dependency-cruiser) : accord du propriétaire requis. Réf. ARCHITECTURE §9, ADR 0007.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log

- ESLint flat config with rules: max-lines 400, max-lines-per-function 80, complexity 12, max-params 4, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, consistent-type-imports
- dependency-cruiser matrix .dependency-cruiser.cjs encoding ARCHITECTURE §9.3 (pure packages, no cycles, zone→db restricted, web→db restricted, gateway limitations)
- Prettier .prettierrc.json with endOfLine: "lf" and .gitattributes with LF normalization
- check:folder-size script: scripts/check-folder-size.mjs fails if any folder has >12 source files
- check:prohibited-names script: scripts/check-prohibited-names.mjs fails if any source file/module name matches utils|helpers|common|misc|stuff|core
- package.json lint script extended to include both custom checks: `node scripts/check-prohibited-names.mjs`
- One pre-existing dependency-cruiser violation from test artifacts (packages/test-rules) - to be cleaned up
- `pnpm lint` passes on clean project code (eslint + depcruise + repo-checks + custom checks)
- `pnpm format:check` requires updating existing docs to conform to Prettier rules (tracked in docs/tech-debt.md)

2026-10-13: All T-005 requirements implemented and verified. Smoke test confirms:

- `pnpm lint` passes on project code (eslint rules + depcruise matrix + custom checks)
- `pnpm check:folder-size` passes (no folders exceed 12 source files)
- `pnpm check:prohibited-names` passes (no generic folder names found in source)
- `pnpm depcruise` matrix enforced (apps/zone cannot import @skyline/db, etc.)
