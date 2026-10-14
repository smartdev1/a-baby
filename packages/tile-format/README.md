# `packages/tile-format/`

- **Owner:** backend developer (shared contract: every change is reviewed by the frontend developer)
- **Status:** Active — T-009 (format v0)

## Role

The file format of a world tile, read by the web client (streaming, prediction) and the zone servers (authoritative collisions). Pure package: depends only on `zod` and `@skyline/geo`.

## How it works

| Piece | Content |
|---|---|
| `TILE_FORMAT_VERSION` | `1` (v1 = water layer, T-103). An incompatible change bumps it; readers reject other versions |
| File names | `tiles/L0/{i}_{j}/<kind>.<hash16>.<ext>` — `geom.glb`, `instances.bin`, `collision.bin`, `meta.json`, `nav.bin`; `world-manifest.<release>.json` |
| `meta.json` | `TileMetaSchema`: buildings (`osm:way/…`, type, levels, heightM, `heightSource` osm/dataset/heuristic), places (game category, **displayed name from the `naming` stage only**, local position), neighbours |
| Manifest | `WorldManifestSchema`: tile key → file hashes (L0: geom, collision, meta, instances; L1+: geom only), UTM bbox, source snapshot, ODbL licence + attribution, optional `osmDerived` (ODbL archive name, sha256, size) and `attributionFile`. No geometry |
| `instances.bin` | Binary v2: instanced modules (props, vegetation, facade bays, roof accessories) — index into `INSTANCE_MODULES`, local position, yaw, scale, variant, width/height stretch |
| `collision.bin` | Binary v1: `SKYC` header, height field (N×N f32), obstacle prisms (base, top, 2D ring), water layer (level + cell mask). Local metres (x = east, z = north) |

```ts
import { decodeCollision, parseTileMeta, tileFilePath } from '@skyline/tile-format';

const meta = parseTileMeta(await (await fetch(url)).json()); // throws TileFormatError with readable paths
const collision = decodeCollision(bytes); // throws CollisionDecodeError (code: truncated, bad-magic, …), never over-reads
```

## Rules

- Every input is untrusted: always parse/decode through this package.
- `instances.bin`, `nav.bin` and LOD L1–L3 come in J1/J2.
- Every source file starts with a `Role:` header comment; keep this README up to date.
