# `tools/content-cli/src/`

- **Owner:** backend developer
- **Status:** Active — T-304

## Role

| File | Role |
|---|---|
| `cli.ts` | `validate [--strict]`, `compile [--out <dir>]` (default `data/build/content`), `schemas` |
| `content-files.ts` | Finds content files by suffix (`.action.json`, `.place.json`, `.job.json`, `.item.json`, `needs/needs.config.json`) and the i18n keys of `content/i18n/<locale>/*.json` (nested objects flattened with dots — format to confirm with the frontend) |
| `content-validation.ts` | Zod parsing, cross references (place types, sites, work actions, items), duplicate ids, file name ↔ id, missing i18n texts (warnings, errors with `--strict`) |
| `content-packs.ts` | Deterministic packs (sorted by id, sorted keys) and generated JSON Schemas |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
