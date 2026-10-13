# `tools/`

- **Owner:** shared (any developer, reviewed by the other one)
- **Status:** Active

## Role

Offline command-line tools (map generation, content validation, asset optimization, load bots, repository checks).

## How it works

Tools run on developer machines or CI, never in the game runtime. They may use Node APIs and pure packages.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
