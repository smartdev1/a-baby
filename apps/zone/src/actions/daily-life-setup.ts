/**
 * Role: assembles the daily-life dependencies of a cell (content, the cell's places and sites, economy, world clock cached and refreshed every 10 s) for the all-in-one and the standalone zone processes.
 * Owner: backend
 */

import type { EconomyPort } from '@skyline/economy-rules';
import { type ClockSegment, gameMinutesAt } from '@skyline/sim-clock';
import { loadCellPlaces } from '../world-data/cell-places-loader.ts';
import type { DailyLifeDeps } from './daily-life.ts';
import { loadDailyLifeContent } from './daily-life-content.ts';

export interface DailyLifeSetup {
  readonly deps: Omit<DailyLifeDeps, 'send'>;
  readonly places: number;
  stop(): void;
}

const CLOCK_REFRESH_MS = 10_000;

export interface DailyLifeSources {
  readonly contentDir: string;
  readonly worldDir: string;
  readonly cellKey: string;
  readonly clock: () => Promise<ClockSegment>;
  readonly economy: EconomyPort;
  /** Starting money of a new character (Djai). */
  readonly starterDjai: number;
}

export const setUpDailyLife = async (sources: DailyLifeSources): Promise<DailyLifeSetup> => {
  const [content, places] = await Promise.all([loadDailyLifeContent(sources.contentDir), loadCellPlaces(sources.worldDir, sources.cellKey)]);
  let segment = await sources.clock();
  const timer = setInterval(() => {
    sources.clock().then(
      (s) => (segment = s),
      () => undefined, // keep the last known segment; game time stays continuous
    );
  }, CLOCK_REFRESH_MS);
  return {
    deps: {
      content,
      places,
      economy: sources.economy,
      gameMinute: () => gameMinutesAt(segment, Date.now()),
      clockRatio: () => (segment.paused ? 0 : segment.ratio),
      starterDjai: sources.starterDjai,
    },
    places: places.size,
    stop: () => clearInterval(timer),
  };
};
