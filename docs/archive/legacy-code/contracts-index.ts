// Network Contracts for SKYLINE - Abidjan District
// This module defines the shared types and schemas between client and server

export type PlayerId = string;
export type SectorId = string;
export type EntityId = string;

// Position in 3D space (using Babylon.js conventions)
export interface Position {
  x: number; // East-West (+X = East)
  y: number; // Up-Down (+Y = Up)
  z: number; // North-South (+Z = North)
}

// Rotation in 3D space
export interface Rotation {
  x: number; // Pitch
  y: number; // Yaw
  z: number; // Roll
}

// Game entity base
export interface GameEntity {
  id: EntityId;
  position: Position;
  rotation: Rotation;
}

// Player-specific data
export interface Player extends GameEntity {
  playerId: PlayerId;
  health: number;
  maxHealth: number;
  djai: number;
  reputation: number;
  currentWeapon: string | null;
}

// NPC types
export interface NPC extends GameEntity {
  npcId: string;
  type: 'mission_giver' | 'activity_giver' | 'ambient';
  isInteractive: boolean;
  dialogueId?: string;
}

// Mission data
export interface Mission {
  missionId: string; // e.g., "MS-01"
  title: string;
  description: string;
  objective: string;
  rewardDjai: number;
  rewardReputation: number;
  isRepeatable: boolean;
}

// Activity data (secondary activities)
export interface Activity {
  activityId: string; // e.g., "LIV-01", "OBJ-02"
  title: string;
  description: string;
  type: 'delivery' | 'search' | 'service';
  rewardAmount: number;
  isRepeatable: boolean;
  cooldownSeconds: number; // 5 minutes = 300 seconds
}

// Network messages from client to server
export interface ClientToServerMessages {
  // Player input (movement, actions)
  input: {
    sequenceNumber: number;
    axes: { x: number; y: number }; // Movement input
    yawPitch: { yaw: number; pitch: number }; // Camera orientation
    flags: {
      sprint: boolean;
      jump: boolean;
      crouch: boolean;
    };
    interval: number; // Time since last input
  };

  // Combat actions
  fire: {
    sequenceNumber: number;
    direction: { x: number; y: number; z: number }; // Normalized direction vector
    clientTimestamp: number; // For lag compensation
  };

  reload: {
    sequenceNumber: number;
  };

  // Interaction with NPCs/objects
  interact: {
    targetId: EntityId;
  };

  // Mission actions
  missionAction: {
    missionId: string;
    action: 'accept' | 'reject' | 'abandon';
  };

  // Activity actions
  activityAction: {
    activityId: string;
    action: 'accept' | 'reject' | 'abandon';
  };

  // Purchase actions
  purchase: {
    idempotencyKey: string; // Prevent duplicate processing
    itemId: string;
    quantity: number;
  };

  // Ping for latency measurement
  ping: {
    clientTimestamp: number;
  };
}

// Network messages from server to client
export interface ServerToClientMessages {
  // State updates (delta compression)
  stateUpdate: {
    entityId: EntityId;
    position: Position;
    rotation: Rotation;
    health?: number;
    djai?: number;
    // ... other mutable fields
  };

  // Input acknowledgment
  inputAck: {
    lastProcessedInput: number;
    authoritativePosition: Position;
  };

  // Combat events
  hit: {
    targetId: EntityId;
    damage: number;
    attackerId: PlayerId;
  };

  death: {
    entityId: EntityId;
    killerId: PlayerId | null; // null for environmental death
  };

  respawn: {
    entityId: EntityId;
    spawnPoint: Position;
  };

  // Mission updates
  objectiveUpdate: {
    missionId: string;
    progress: number; // 0-100%
    status: 'active' | 'completed' | 'failed';
  };

  // Rewards
  reward: {
    amount: number;
    type: 'djai' | 'reputation';
    transactionId: string;
  };

  // Purchase results
  purchaseResult: {
    success: boolean;
    balance: number;
    idempotencyKey: string;
    errorMessage?: string;
  };

  // Error messages
  error: {
    code: string;
    message: string;
  };

  // Ping response
  pong: {
    clientTimestamp: number;
    serverTimestamp: number;
  };
}

// Shared game configuration
export interface GameConfig {
  worldSize: number; // 300 meters for SKYLINE
  sectorSize: number; // 100 meters
  maxPlayersPerSession: number;
  physicsTickRate: number; // 20-30 ticks per second
  stateSendRate: number; // 15-20 updates per second

  // Player constants
  maxHealth: number;
  walkSpeed: number; // m/s
  sprintSpeed: number; // m/s

  // Combat constants
  pistolDamage: number;
  pistolRange: number; // meters
  pistolFireRate: number; // shots per second

  // Economy constants
  startingDjai: number;
  startingReputation: number;

  // Activity rewards
  deliveryReward: number;
  searchReward: number;
  serviceReward: number;
}

// Export all types for easy importing
export type {
  PlayerId,
  SectorId,
  EntityId,
  Position,
  Rotation,
  GameEntity,
  Player,
  NPC,
  Mission,
  Activity,
  ClientToServerMessages,
  ServerToClientMessages,
  GameConfig
};