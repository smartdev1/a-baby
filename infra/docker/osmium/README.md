# `infra/docker/osmium/`

- **Owner:** backend developer
- **Status:** Active — T-022

## Role

Frozen image of osmium-tool used by the map pipeline, so Windows and Linux machines produce the same files.

## How it works

- Base `debian:trixie-slim` pinned by digest, `osmium-tool=1.18.0-1` and `gdal-bin=3.10.3+dfsg-1` pinned by version, entrypoint `osmium` (`--entrypoint gdalwarp` for the DEM).
- Build once per machine: `pnpm map:osmium-image` (tag `skyline/osm-tools:2`).
- Used by `tools/map-pipeline/src/osmium/run-osmium.ts`.

## Rules

- Changing the Dockerfile = bump the tag here, in `package.json` (`map:osmium-image`) and in `osmium-commands.ts` (`OSMIUM_IMAGE`).
