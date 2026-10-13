# `apps/web/src/app/`

- **Owner:** frontend developer
- **Status:** Active

## Role

Composition root of the client: `main.ts` (max 60 lines), startup sequence, client configuration.

## How it works

Creates the engine, wires modules together and starts the frame loop. No logic here.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
