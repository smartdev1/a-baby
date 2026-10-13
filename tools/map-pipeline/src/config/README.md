# `tools/map-pipeline/src/config/`

- **Owner:** backend developer
- **Status:** Active — T-010

## Role

Validated configuration of a commune build.

## Contents

| File | Role |
|---|---|
| `pipeline-config-schema.ts` | Zod schema: commune, seed, source (`local-file` or `osm-snapshot`), boundary relation, margin, output dir |
| `load-pipeline-config.ts` | Reads a `config/*.pipeline.json` and fails with a readable message when invalid |

## Rules

- Every path in a config is repository-relative with `/` separators (Windows and Linux); absolute paths are rejected.
- Every source file starts with a `Role:` header comment; keep this README up to date.
