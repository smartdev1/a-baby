# `packages/`

- **Owner:** shared (any developer, reviewed by the other one)
- **Status:** Active

## Role

Libraries shared by apps and tools, with strict boundaries (ARCHITECTURE §9.3).

## How it works

`[pure]` packages contain game rules and formats with no DOM, no Node API and no Babylon. `bus`, `observability` and `db` are Node-only. Each package exposes its public API through `src/index.ts` only; deep imports are forbidden.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
