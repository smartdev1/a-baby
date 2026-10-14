# `packages/content-schema/`

- **Owner:** backend developer
- **Status:** Active — T-301 (actions, needs, place types, jobs, items)

## Role

Zod schemas of all game content (actions, jobs, items, place types, transport lines, housing, businesses).

## How it works

Public API is exported from `src/index.ts` only. Profile: `pure` (Zod only). The Zod schemas are the source of truth; JSON Schemas are generated from them (`jsonSchemaOf`) by `tools/content-cli` for editor autocompletion.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
