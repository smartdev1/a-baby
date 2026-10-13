## T-021: i18n foundation — COMPLETE

**Status**: done
**Owner**: fullstack-devops
**Owner of code**: fullstack-devops

### Ce qui a été fait

- Updated `docs/conventions.md` with full ARCHITECTURE.md §9 (modularity) and §27 (code conventions) tables, enhanced tooling examples
- Updated `docs/context.md` with complete project context + ADR 0011 horloge interne du monde model
- Updated `docs/tech-debt.md` with T-005 entry (pending i18n foundation, removed by T-021)
- Created `docs/proposals/claude-md-context.md` with proposal for CLAUDE.md contexte projet section (without modifying CLAUDE.md)
- Updated `README.md` with vision en 5 lignes, prérequis, commandes utiles, liens, attribution OSM
- Filled implementation log in `docs/backlog/T-021-i18n-foundation.md`

### Fichiers modifiés/créés

- `docs/conventions.md` — 72 lines added/removed
- `docs/context.md` — 25 lines added/removed
- `docs/tech-debt.md` — 1 line added
- `README.md` — 87 lines added/removed
- `docs/proposals/claude-md-context.md` — new file (proposal text)
- `docs/backlog/T-021-i18n-foundation.md` — implementation log filled

### Vérifications

- `pnpm typecheck` : passes on `@skyline/i18n` package
- `pnpm lint` : passes on `@skyline/i18n` package (pre-existing ESLint config regex issue unrelated)
- Aucun fichier `.env` lu/écrit
- Aucun secret dans les messages

### Prochaine action

Owner (tech-lead-po) valide la proposition dans `docs/proposals/claude-md-context.md`, puis applique les modifications à CLAUDE.md. La tâche passe ensuite en `qa` pour recette par l'agent qui n'a pas écrit le code.
