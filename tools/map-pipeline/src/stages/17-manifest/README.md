# `tools/map-pipeline/src/stages/17-manifest/`

- **Owner:** backend developer
- **Status:** Active — T-012

## Role

Writes `world-manifest.{commune}-{snapshotDate}.json` (e.g. `world-manifest.yopougon-2026-10-01.json`): tile key → file hashes, UTM bbox, source snapshot (provider, file, date, sha256), ODbL licence and attribution. No local path, no machine name. Validated by `@skyline/tile-format`.

Also writes (T-203, ODbL — ADR 0006):

- `ATTRIBUTION.md`: OpenStreetMap (ODbL, snapshot and sha256) and Copernicus DEM attribution.
- `osm-derived.<release>.tar.gz`: the OSM-derived database of the release (`normalized`, `classified`, `buildings`, `road-nodes`, `road-edges`, `place-names`) with a README stating the ODbL. Deterministic (`src/writers/deterministic-tar-gz.ts`); its name, sha256 and size are in the manifest (`osmDerived`). Yopougon: 20.5 MB.

`release-attribution.ts` holds the texts and the list of derived files.

A release = this manifest + `ATTRIBUTION.md` + the ODbL archive + the `tiles/` folders of `16-encode` (L0) and `15-lod-build` (L1–L3), to be published to object storage / CDN later. **The ODbL archive must be published with the game** (owner, at release time).
