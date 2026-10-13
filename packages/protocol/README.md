# `packages/protocol/`

- **Owner:** backend developer (shared contract: every change is reviewed by the frontend developer)
- **Status:** Active — T-107 (protocol v1)

## Role

The client ↔ gateway protocol over one WebSocket: version, message types, bounded binary codecs for the hot path, MessagePack + Zod for control messages. Pure package.

## Messages (v1)

Every frame starts with a 1-byte type.

| Direction | Message       | Encoding          | Size / content                                                                                                      |
| --------- | ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| C → S     | `hello`       | MessagePack + Zod | protocol version, session ticket (≤ 512 chars), client build                                                        |
| C → S     | `input`       | binary            | **10 bytes**: seq u32, move axes i8 ×2 (−1…1), yaw u16, flags (run, jump, interact). An intention, never a position |
| C → S     | `ping`        | binary            | client time f64                                                                                                     |
| S → C     | `welcome`     | MessagePack + Zod | protocol version, player entity id, tick rate, **frame origin** (UTM of the cell SW corner), cell key               |
| S → C     | `input_ack`   | binary            | 27 bytes: last seq, tick, authoritative position (mm), velocity (cm/s) — for reconciliation                         |
| S → C     | `snapshot`    | binary            | tick + ≤ 512 entities × 19 bytes (id, position mm, yaw, state)                                                      |
| S → C     | `world_clock` | MessagePack + Zod | clock segment: real start, game start (minutes), ratio, paused (ADR 0011)                                           |
| S → C     | `pong`        | binary            | client time echoed + server time                                                                                    |
| S → C     | `error`       | MessagePack + Zod | code (`version_mismatch`, `invalid_ticket`, …) + message                                                            |

Positions are metres relative to the frame origin of `welcome` (x = east, y = up, z = north), sent as integer millimetres: a float32 on raw UTM values (~380 000 m) would only be precise to ~3 cm.

```ts
import { decodeClientMessage, encodeServerMessage, checkHello } from '@skyline/protocol';
const message = decodeClientMessage(frame); // untrusted: throws only ProtocolDecodeError
```

## Rules

- Decoding untrusted frames never throws anything but `ProtocolDecodeError` (fuzzed with 10 000 frames per direction); MessagePack decoding is bounded (strings, arrays, maps, depth).
- An incompatible change bumps `PROTOCOL_VERSION` and updates the round-trip tests.
- Every source file starts with a `Role:` header comment; keep this README up to date.
