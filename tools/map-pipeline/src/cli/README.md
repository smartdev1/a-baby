# `tools/map-pipeline/src/cli/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Command line entry point.

## How it works

```bash
pnpm map:build --config tools/map-pipeline/config/fixture.pipeline.json [--force]
```

| File | Role |
|---|---|
| `main.ts` | Composition: parse args → find repo root → load config → run stages → print a summary |
| `parse-cli-args.ts` | `build --config <file> [--force]` |
| `find-repo-root.ts` | Finds the folder holding `pnpm-workspace.yaml` (config paths are repository-relative) |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
