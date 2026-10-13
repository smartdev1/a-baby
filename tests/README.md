# `tests/`

- **Owner:** shared (any developer, reviewed by the other one)
- **Status:** Planned

## Role

Cross-cutting tests only (unit tests live next to the code as `*.test.ts`).

## How it works

`e2e/` = Playwright on the client, `integration/` = multi-component scenarios in all-in-one mode, `load/` = bot scenarios with thresholds.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
