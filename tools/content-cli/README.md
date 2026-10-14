# `tools/content-cli/`

- **Owner:** backend developer
- **Status:** Active — T-304

## Role

Content validation and compilation CLI.

```bash
pnpm content:validate          # schemas + cross references; missing texts are warnings
pnpm content:validate --strict # missing texts are errors (CI once the fr-CI catalogue exists)
pnpm content:compile           # packs in data/build/content/
pnpm content:schemas           # regenerate tools/content-cli/schemas/*.schema.json from Zod
```

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
