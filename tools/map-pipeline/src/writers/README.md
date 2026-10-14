# `tools/map-pipeline/src/writers/`

- **Owner:** backend developer
- **Status:** Active — T-203

## Role

Writers of release artefacts that are not tile files.

| File | Role |
|---|---|
| `deterministic-tar-gz.ts` | `.tar.gz` with byte-identical output on every machine (ustar, entries in the given order, fixed mtime, uid/gid 0, mode 0644, streamed contents, gzip OS byte neutralised). Used for the ODbL archive of the `osm-derived` layer |

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
