# `tools/map-pipeline/src/sources/`

- **Owner:** backend developer
- **Status:** Active — T-022

## Role

Frozen data sources: reading `data/sources/sources.lock.json` and downloading snapshots.

| File | Role |
|---|---|
| `sources-lock.ts` | Zod schema + loaders of the lock (Geofabrik URL, snapshot date, size, sha256, md5, ODbL) and `OSM_CACHE_DIR` |
| `download-file.ts` | Streaming HTTPS download through a `.part` file (never leaves a half file) |

## Rules

- The lock is the only place where the snapshot is chosen; updating it is a deliberate, reviewed change.
- Every source file starts with a `Role:` header comment; keep this README up to date.
