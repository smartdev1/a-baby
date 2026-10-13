# `packages/tile-format/src/`

- **Owner:** backend developer
- **Status:** Active — T-009

## Role

Source code of `@skyline/tile-format`.

| File                       | Role                                                  |
| -------------------------- | ----------------------------------------------------- |
| `index.ts`                 | Public API                                            |
| `format-version.ts`        | `TILE_FORMAT_VERSION`                                 |
| `tile-file-names.ts`       | Tile folder / file / manifest names (build and parse) |
| `tile-meta-schema.ts`      | `meta.json` schema (buildings, places, neighbours)    |
| `world-manifest-schema.ts` | Release manifest schema                               |
| `parse-tile-json.ts`       | Validation with readable errors (`TileFormatError`)   |
| `collision/`               | `collision.bin` codec                                 |

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
