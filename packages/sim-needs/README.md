# `packages/sim-needs/`

- **Owner:** backend developer
- **Status:** Active — T-302

## Role

Needs simulation rules (hunger, energy, hygiene, social, fun): decay over game time and action effects.

## How it works

Public API is exported from `src/index.ts` only. Profile: `pure`. Needs are satisfaction values (100 = satisfied, 0 = empty with penalties), decayed per **game** hour from `content/needs/needs.config.json`, frozen while offline (`resumeNeeds`), rounded to 1/100 so every machine agrees.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
