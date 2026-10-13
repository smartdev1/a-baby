# `packages/tile-format/src/collision/`

- **Owner:** backend developer
- **Status:** Active — T-009

## Role

Binary codec of `collision.bin` v0 — the single collision format read by the client and the server (ARCHITECTURE §10.3, §31.6).

| File | Role |
|---|---|
| `collision-codec.ts` | Layout, limits, `encodeCollision`, `decodeCollision` |
| `bounded-reader.ts` | Bounds-checked little-endian reader + `CollisionDecodeError` (typed codes) |
| `growable-writer.ts` | Little-endian writer for encoding |

## Rules

- Decoding never reads out of bounds and never allocates beyond `COLLISION_LIMITS` (resolution ≤ 1025, ≤ 65 535 prisms, ≤ 4 096 vertices per prism).
- Tested by round-trip properties and a 10 000-case fuzz.
