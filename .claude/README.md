# `.claude/`

- **Owner:** project owner only
- **Status:** Active

## Role

Claude Code configuration of the project: agents, hooks, skills, settings.

## How it works

`settings.json` registers the role-guard hook. Each developer sets their role in `.claude/role.local` (git-ignored).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
