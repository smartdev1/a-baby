# `packages/protocol/src/`

- **Owner:** backend developer
- **Status:** Active — T-107

## Role

Source code of `@skyline/protocol`.

| Path | Role |
|---|---|
| `index.ts` | Public API |
| `protocol-version.ts`, `message-types.ts`, `protocol-errors.ts`, `handshake.ts` | Version, type ids, typed errors, version check |
| `client-messages.ts`, `server-messages.ts` | One encoder / decoder per direction |
| `messages/` | Movement (input, input_ack, snapshot), clock (ping, pong), control (MessagePack schemas and codec) |
| `binary/` | Bounded frame reader, fixed-size writer, quantization helpers |

Tests: `messages-roundtrip.test.ts` (fast-check), `decode-fuzz.test.ts` (10 000 frames per direction).
