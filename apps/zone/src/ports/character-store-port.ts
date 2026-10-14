/**
 * Role: port to the characters' saved state (ARCHITECTURE §13.5): position (absolute UTM), needs; written at checkpoints (60 s), at the final disconnection, read when the character joins again.
 * Owner: backend
 */

import type { NeedValues } from '@skyline/sim-needs';

export interface CharacterCheckpoint {
  readonly characterId: string;
  readonly eastingM: number;
  readonly northingM: number;
  readonly y: number;
  readonly yawRad: number;
  readonly needs: NeedValues | null;
  readonly savedAtMs: number;
}

export interface CharacterStorePort {
  load(characterId: string): Promise<CharacterCheckpoint | null>;
  save(checkpoint: CharacterCheckpoint): Promise<void>;
}
