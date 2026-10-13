# `tools/map-pipeline/src/osmium/`

- **Owner:** backend developer
- **Status:** Active — T-022

## Role

Everything about osmium-tool, which always runs inside the frozen Docker image `skyline/osm-tools:2` (`infra/docker/osmium/`).

| File                 | Role                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `osmium-commands.ts` | Pure builders of `extract`, `tags-filter`, `export` argument arrays; the list of kept OSM tags; the image tag               |
| `run-osmium.ts`      | Runs `docker run --rm` with `/in` (read-only) and `/out` bind mounts, as the current user on Linux; checks the image exists |

## Rules

- No shell strings: arguments are arrays (safe on Windows and Linux).
- Outputs are written without user metadata (`add_metadata=false`): smaller, deterministic, no contributor names.
- Changing the tag list or the image invalidates the extract cache (they are stage params).
