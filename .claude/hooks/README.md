# `.claude/hooks/`

- **Owner:** project owner only
- **Status:** Active

## Role

Hook scripts run by Claude Code.

## How it works

`enforce-role.mjs` blocks edits outside the active role's folders (ownership map: `ownership.json`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
