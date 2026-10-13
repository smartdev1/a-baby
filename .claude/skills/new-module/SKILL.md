---
name: new-module
description: Create a new SkyLine file, folder, package or service module that passes the repository rules (Role header, folder README, size limits, naming, package boundaries). Use whenever you add a file or folder to the monorepo.
---

# Creating code in SkyLine

## Every new source file
Start with a header comment in the first lines (checked by `pnpm lint`):

```ts
/**
 * Role: <one sentence: what this file does, not how>.
 * Owner: frontend | backend | shared
 */
```
HTML: `<!-- Role: ... -->` · YAML/shell: `# Role: ...` · tsconfig/JSON with a `"//"` key. Plain JSON data files are documented by their folder README.

Name the file after what it does, in kebab-case: `tile-lod-selector.ts`, `wallet-transfer.ts`. Never `utils`, `helpers`, `common`, `misc`, `core`, `*Manager`.

## Every new folder
Create `README.md` with: owner, status, **Role** (one paragraph), **How it works**, **Rules**. Update the parent README if the folder changes its contents.

## Limits (ESLint + repo-checks)
- ≤ 400 lines per file (aim for 250), ≤ 80 lines per function, complexity ≤ 12, ≤ 4 params.
- ≤ 12 source files per folder: split into sub-folders by concept beyond that.
- `main.ts` ≤ 60 lines, composition only.

## New package
1. `packages/<name>/` with `package.json` (`@skyline/<name>`, `"type": "module"`, `"exports": { ".": "./src/index.ts" }`, `typecheck` script), `tsconfig.json` extending `tsconfig.pure.json` or `tsconfig.node.json`, `README.md`, `src/README.md`, `src/index.ts`.
2. Add it to the matrix in ARCHITECTURE §9.3 and to `.dependency-cruiser.cjs` if it is pure.
3. Add the folder to `.claude/ownership.json` (owner approval).
4. Other packages import it only through `@skyline/<name>` (no deep imports).

## New services module (`apps/services/src/modules/<name>/`)
Sub-folders `api/` (routes + DTO, Zod), `application/` (use cases), `domain/`, `infra/` (Prisma), `bus/`. Never import another module's `infra/`.

## Before finishing
`pnpm lint && pnpm typecheck && pnpm test` must pass.
