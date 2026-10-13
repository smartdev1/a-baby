# `packages/physics/`

- **Owner:** backend developer (shared contract: every change is reviewed by the frontend developer)
- **Status:** Active — T-106

## Role

The one movement code run by **both** the client (prediction) and the zone server (authority), against the same `collision.bin` tiles. Pure package (depends only on `@skyline/tile-format` types).

## How it works

- `CollisionWorld`: decoded tile collisions placed in a common frame (the frame origin of the protocol `welcome`), bilinear ground height, prisms indexed in a 16 m grid.
- `stepCharacter(world, state, input)`: fixed 50 ms step (20 Hz). Capsule 0.30 m × 1.75 m; walk 1.6 m/s, run 4.5 m/s; jump 4.2 m/s, gravity 9.81 m/s².
  - Horizontal move split into sub-steps of ≤ 15 cm (no wall tunnelling), capsule pushed out of blocking prisms → sliding along walls.
  - Prisms ≤ 35 cm above the feet are stepped on (kerbs, steps); slopes steeper than 45° block.
  - Gravity, jump, grounding and snapping down small drops.
- Input is the protocol `input` intention (axes, yaw, run, jump): never a position.

```ts
import { CollisionWorld, stepCharacter } from '@skyline/physics';
const next = stepCharacter(world, state, { moveX: 0, moveZ: 1, yawRad: 0, run: false, jump: false });
```

## Rules

- Pure and deterministic: no `Math.random`, no clock. Same JS engine ⇒ bit-identical results; across engines (V8 vs Firefox) `Math.sin/cos` may differ in the last bit, which reconciliation absorbs.
- Tested: unit cases, 10 000 random moves in a dense synthetic city, and 10 000 steps through the real Pigeons fixture tiles (`tools/map-pipeline/src/stages/physics-on-fixture.test.ts`).
- Every source file starts with a `Role:` header comment; keep this README up to date.
