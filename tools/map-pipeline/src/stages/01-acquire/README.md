# `tools/map-pipeline/src/stages/01-acquire/`

- **Owner:** backend developer
- **Status:** Active — T-022

## Role

Guarantees that the OSM snapshot named in `data/sources/sources.lock.json` is in `data/cache/osm/` with the exact sha256.

## How it works

- Missing file → downloaded once from Geofabrik (≈ 85 MB), then verified.
- Present file with the right sha256 → nothing downloaded.
- Present file with another sha256 → the build stops with an explicit message (never silently replaced).
- The cached file is a declared input: deleting or corrupting it re-runs this stage.
- Output: `snapshot.json` (lock entry + cached path).
