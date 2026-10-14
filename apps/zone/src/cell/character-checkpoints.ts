/**
 * Role: persistence of the characters of a cell (ARCHITECTURE §13.5): every 60 s and at the final disconnection their position and needs go to the CharacterStorePort; a character joining again starts where it was saved (if that cell belongs to the cluster) with its saved needs. Anonymous dev sessions are never saved.
 * Owner: backend
 */

import { cellKeyOf, isInsideGrid, type UtmPosition } from '@skyline/geo';
import type { Logger } from '@skyline/observability';
import type { CharacterState } from '@skyline/physics';
import type { NeedValues } from '@skyline/sim-needs';
import type { CharacterCheckpoint, CharacterStorePort } from '../ports/character-store-port.ts';

export const CHECKPOINT_EVERY_MS = 60_000;

export interface CheckpointSubject {
  readonly characterId: string;
  readonly state: CharacterState;
  readonly yawRad: number;
  readonly needs: NeedValues | null;
}

export interface Restored {
  readonly state: CharacterState;
  readonly yawRad: number;
  readonly needs: NeedValues | null;
}

export class CharacterCheckpoints {
  constructor(
    private readonly store: CharacterStorePort,
    private readonly frameOrigin: UtmPosition,
    private readonly cluster: ReadonlySet<string>,
    private readonly logger: Logger,
  ) {}

  /** Saved state of a character in this cell's frame, or null (never saved, or saved in a cell no zone owns). */
  async restore(characterId: string): Promise<Restored | null> {
    const saved = await this.store.load(characterId).catch((err: unknown) => {
      this.logger.warn({ err }, 'character checkpoint unreadable');
      return null;
    });
    if (!saved) return null;
    const utm = { eastingM: saved.eastingM, northingM: saved.northingM };
    if (!isInsideGrid(utm) || !this.cluster.has(cellKeyOf(utm))) return null;
    const position = { x: saved.eastingM - this.frameOrigin.eastingM, y: saved.y, z: saved.northingM - this.frameOrigin.northingM };
    return { state: { position, velocity: { x: 0, y: 0, z: 0 }, grounded: true }, yawRad: saved.yawRad, needs: saved.needs };
  }

  async save(subjects: readonly CheckpointSubject[], nowMs: number): Promise<void> {
    await Promise.all(subjects.map((s) => this.store.save(this.checkpointOf(s, nowMs)).catch((err: unknown) => this.logger.warn({ err }, 'character checkpoint failed'))));
  }

  private checkpointOf(s: CheckpointSubject, nowMs: number): CharacterCheckpoint {
    const { x, y, z } = s.state.position;
    return { characterId: s.characterId, eastingM: this.frameOrigin.eastingM + x, northingM: this.frameOrigin.northingM + z, y, yawRad: s.yawRad, needs: s.needs, savedAtMs: nowMs };
  }
}
