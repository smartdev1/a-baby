# `packages/protocol/src/messages/`

- **Owner:** backend developer
- **Status:** Active — T-107

## Role

Message codecs: `movement-messages.ts` (binary hot path), `clock-messages.ts` (ping / pong), `control-schemas.ts` + `control-codec.ts` (MessagePack + Zod with decode limits).
