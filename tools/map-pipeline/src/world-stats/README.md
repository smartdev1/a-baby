# `tools/map-pipeline/src/world-stats/`

- **Owner:** backend developer
- **Status:** Active — T-204

## Role

Statistics of the generated world, written by stage `18-report` as `world-report.json` and `world-report.md`.

| File | Role |
|---|---|
| `world-stats.ts` | Per level (L0–L3): tile count, total size, size / triangles (mean, p95, max); L0 draw calls and instances; tiles above 80 % of a budget maximum (§10.4); instances by family (`prp`, `veg`, `bld`), facades, sheet roofs, place names |
| `world-report-markdown.ts` | Markdown rendering |

Inputs: `16-encode/encode-index.json`, `15-lod-build/lod-index.json`, `12-props/props-report.json`, `11-facades-roofs/facades-report.json`, `09-naming/naming-report.json`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
