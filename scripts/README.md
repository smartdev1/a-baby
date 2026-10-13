# `scripts/`

- **Owner:** shared
- **Status:** Active

## Role

Repository-wide checks run by `pnpm lint` / `pnpm check:*`.

| File | Role |
|---|---|
| `check-prohibited-names.mjs` | Fails when a source file or folder name contains a catch-all word (`utils`, `helpers`, `common`, `misc`, `stuff`, `core`). Walks the repository root, resolved from the script. |
| `check-folder-size.mjs` | Fails when a folder holds more than 12 source files (`pnpm check:folder-size`). |

## Rules

- Every source file starts with a `Role:` header comment.
- No absolute or machine-specific path: resolve from the script location.
- Keep this README up to date when the folder content changes.
