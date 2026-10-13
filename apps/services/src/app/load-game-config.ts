/**
 * Role: reads and validates the game parameters the services need from content/game-config (world clock).
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type ClockConfig, ClockConfigSchema } from '@skyline/sim-clock';

export const loadClockConfig = async (contentDir: string): Promise<ClockConfig> =>
  ClockConfigSchema.parse(JSON.parse(await readFile(join(contentDir, 'game-config', 'clock.json'), 'utf8')));
