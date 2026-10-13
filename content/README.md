# `content/`

- **Owner:** shared (any developer, reviewed by the other one)
- **Status:** Planned — first files in J3

## Role

Game content authored by the team (NOT derived from OSM): one definition per JSON file.

## How it works

Validated by `tools/content-cli` against `@skyline/content-schema`. Backend owns gameplay data (actions, jobs, items, places, transport, economy); frontend owns texts, dialogues, appearance and interiors.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
