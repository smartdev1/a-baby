# Conventions

The authoritative rules are in `ARCHITECTURE.md` §9 (modularity) and §27 (code conventions), and in `docs/rules/` per role. Summary:

- **Role header** at the top of every source file (`Role:` + `Owner:`); **README.md** in every folder.
- Files `kebab-case.ts`; types `PascalCase`; functions `camelCase`; config constants `SCREAMING_SNAKE_CASE`; packages `@skyline/<name>`.
- ≤ 400 lines per file, ≤ 80 per function, complexity ≤ 12, ≤ 4 params, ≤ 12 source files per folder, `main.ts` ≤ 60 lines.
- No `utils` / `helpers` / `common` / `misc` / `core` / `*Manager`; no `any`; no deep imports; no cycles.
- Units in names when ambiguous (`*Ms`, `*S`, `*GameMin`); Djai as `bigint` on the server; game time only through `@skyline/sim-clock`.
- Content ids `category.name_snake`; asset names `category_name_variant_lod`.
- Tests next to the code, `*.test.ts`, "should … when …".
- Conventional Commits in English, no Claude co-author line; one task = one branch = one PR.

## Tooling examples

- `pnpm verify` — lint (ESLint + dependency-cruiser + repo checks) + typecheck + tests, as in CI.
- `pnpm test:coverage` — coverage report; pure packages with code must keep ≥ 85 % lines (thresholds in `vitest.config.ts`).
- Property test model (fast-check): `packages/geo/src/utm-projection.test.ts` (10 000-run round trip) and `packages/tile-format/src/collision/collision-codec.test.ts` (round trip + 10 000-case fuzz).
- Golden test model: `tools/map-pipeline/src/stages/pipeline-golden.test.ts` (`UPDATE_GOLDEN=1` to accept an intended change).
