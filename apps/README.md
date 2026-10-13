# `apps/`

- **Owner:** shared (any developer, reviewed by the other one)
- **Status:** Active

## Role

Executable applications: the browser client and the three server processes.

## How it works

Each app has `src/app/main.ts` as composition root (max 60 lines, wiring only). Apps never import each other; they share code through `packages/*`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
