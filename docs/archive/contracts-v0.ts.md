# Contracts Archive v0 — Reusable Types for J1-12

## Position
```ts
export interface Position {
  x: number; // East-West (+X = East)
  y: number; // Up-Down (+Y = Up)
  z: number; // North-South (+Z = North)
}
```

## Rotation
```ts
export interface Rotation {
  x: number; // Pitch
  y: number; // Yaw
  z: number; // Roll
}
```

## PlayerId, SectorId, EntityId
```ts
export type PlayerId = string;
export type SectorId = string;
export type EntityId = string;
```

## ClientToServerMessages — reusable fields
```ts
// Player input (movement, actions)
export interface Input {
  sequenceNumber: number;
  axes: { x: number; y: number }; // Movement input
  yawPitch: { yaw: number; pitch: number }; // Camera orientation
  flags: {
    sprint: boolean;
    jump: boolean;
    crouch: boolean;
  };
  interval: number; // Time since last input
}

// Combat actions
export interface Fire {
  sequenceNumber: number;
  direction: { x: number; y: number; z: number }; // Normalized direction vector
  clientTimestamp: number; // For lag compensation
}

// Interaction with NPCs/objects
export interface Interact {
  targetId: EntityId;
}

// Mission actions
export interface MissionAction {
  missionId: string;
  action: 'accept' | 'reject' | 'abandon';
}

// Activity actions
export interface ActivityAction {
  activityId: string;
  action: 'accept' | 'reject' | 'abandon';
}

// Purchase actions — idempotency protected
export interface Purchase {
  idempotencyKey: string; // Prevent duplicate processing
  itemId: string;
  quantity: number;
}

// Ping for latency measurement
export interface Ping {
  clientTimestamp: number;
}
```

## Export
All types above are exported from `docs/archive/contracts-v0.ts.md` for easy importing in J1 protocol implementation.

**Usage**: Import `{ Position, Input, Interact, Purchase, Ping } from '@skyline/contracts-v0'` (or local path) for J1-12 protocol definition.