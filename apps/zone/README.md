# `apps/zone/`

- **Owner:** backend developer
- **Status:** Active — T-108 (one cell in all-in-one mode)

## Role

Cell server process: authoritative simulation of one or more 1 km cells.

## How it works

Never imports `@skyline/db`; persistence goes through ports.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
