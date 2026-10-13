# `tools/repo-checks/`

- **Owner:** shared (any developer, reviewed by the other one)
- **Status:** Active

## Role

Repository hygiene checks run by `pnpm lint`.

## How it works

Checks: role header in every source file, README.md in every folder, max 12 source files per folder, forbidden catch-all file names.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
