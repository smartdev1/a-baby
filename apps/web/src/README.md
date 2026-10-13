# `apps/web/src/`

- **Owner:** frontend developer
- **Status:** Active

## Role

Client source code, split by responsibility.

## How it works

Rendering (`world-render`) and UI (`ui`) never import each other; they communicate through signal stores exposed by `app/`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
