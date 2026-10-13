# `infra/`

- **Owner:** backend developer
- **Status:** Planned

## Role

Infrastructure artifacts PREPARED, NEVER EXECUTED by agents: Dockerfiles, Compose files, dashboards.

## How it works

Humans run them. Any change requires the owner's approval (CLAUDE.md). Folders: `docker/` (osmium, latency probe), `ci/` (prepared GitHub Actions workflow), `compose/`, `observability/`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
