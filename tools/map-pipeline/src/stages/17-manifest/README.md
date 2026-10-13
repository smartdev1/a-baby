# `tools/map-pipeline/src/stages/17-manifest/`

- **Owner:** backend developer
- **Status:** Active — T-012

## Role

Writes `world-manifest.{commune}-{snapshotDate}.json` (e.g. `world-manifest.yopougon-2026-10-01.json`): tile key → file hashes, UTM bbox, source snapshot (provider, file, date, sha256), ODbL licence and attribution. No local path, no machine name. Validated by `@skyline/tile-format`.

A release = this manifest + the `tiles/` folder of `16-encode` (to be published to object storage / CDN later).
