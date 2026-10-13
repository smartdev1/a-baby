# `apps/services/src/modules/`

- **Owner:** backend developer
- **Status:** Planned

## Role

Business modules. Each module is split into `api/` (routes + DTO), `application/` (use cases), `domain/`, `infra/` (Prisma), `bus/`.

## How it works

A module never imports the `infra/` of another module, only its public `application/`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
