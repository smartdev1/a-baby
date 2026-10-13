/**
 * Role: world clock use cases: current segment (created once from clock.json), ratio change, pause and resume — each persisted before being returned.
 * Owner: backend
 */

import { changeRatio, type ClockConfig, type ClockSegment, pause, resume } from '@skyline/sim-clock';

/** Port: where the current clock segment survives restarts (file now, PostgreSQL in J6). */
export interface ClockSegmentStore {
  load(): Promise<ClockSegment | null>;
  save(segment: ClockSegment): Promise<void>;
}

export type RealClock = () => number;

export class WorldClockService {
  constructor(
    private readonly store: ClockSegmentStore,
    private readonly config: ClockConfig,
    private readonly now: RealClock,
  ) {}

  /** The segment in force; the very first call starts the world clock at `initialGameMin`. */
  async current(): Promise<ClockSegment> {
    const stored = await this.store.load();
    if (stored) return stored;
    const first: ClockSegment = {
      realStartMs: this.now(),
      gameStartMin: this.config.initialGameMin,
      ratio: this.config.ratio,
      paused: false,
    };
    await this.store.save(first);
    return first;
  }

  async setRatio(ratio: number): Promise<ClockSegment> {
    return this.replace(changeRatio(await this.current(), ratio, this.now()));
  }

  async pause(): Promise<ClockSegment> {
    return this.replace(pause(await this.current(), this.now()));
  }

  async resume(): Promise<ClockSegment> {
    return this.replace(resume(await this.current(), this.now()));
  }

  private async replace(segment: ClockSegment): Promise<ClockSegment> {
    await this.store.save(segment);
    return segment;
  }
}
