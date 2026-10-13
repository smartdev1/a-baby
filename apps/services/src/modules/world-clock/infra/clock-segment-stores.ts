/**
 * Role: ClockSegmentStore adapters: in memory (tests, all-in-one dev) and a JSON file (survives restarts until the database arrives in J6).
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import type { ClockSegment } from '@skyline/sim-clock';
import type { ClockSegmentStore } from '../application/world-clock-service.ts';

const SegmentSchema = z
  .object({ realStartMs: z.number(), gameStartMin: z.number(), ratio: z.number().positive(), paused: z.boolean() })
  .strict();

export class InMemoryClockSegmentStore implements ClockSegmentStore {
  private segment: ClockSegment | null = null;
  load(): Promise<ClockSegment | null> {
    return Promise.resolve(this.segment);
  }
  save(segment: ClockSegment): Promise<void> {
    this.segment = segment;
    return Promise.resolve();
  }
}

export class FileClockSegmentStore implements ClockSegmentStore {
  constructor(private readonly path: string) {}

  async load(): Promise<ClockSegment | null> {
    if (!existsSync(this.path)) return null;
    return SegmentSchema.parse(JSON.parse(await readFile(this.path, 'utf8')));
  }

  /** Atomic write (temp file + rename) so a crash never leaves a half-written segment. */
  async save(segment: ClockSegment): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    await writeFile(tmp, `${JSON.stringify(segment)}\n`);
    await rename(tmp, this.path);
  }
}
