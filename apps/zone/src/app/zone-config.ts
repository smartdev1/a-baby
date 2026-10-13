/**
 * Role: configuration of the standalone zone process from environment variables (owned cells, cluster cells, NATS, world release, services URL, spawn point, stats port).
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import type { UtmPosition } from '@skyline/geo';
import { z } from 'zod';

const repoPath = (relative: string): string => fileURLToPath(new URL(`../../../../${relative}`, import.meta.url));
const cellList = z
  .string()
  .transform((v) => v.split(',').map((c) => c.trim()).filter(Boolean))
  .pipe(z.array(z.string().regex(/^C_\d+_\d+$/)).min(1));

const Schema = z.object({
  /** Cells simulated by this process, e.g. "C_81_49". */
  ZONE_CELLS: cellList.default(['C_81_49']),
  /** Every cell owned by some zone process (players may only cross into these); defaults to ZONE_CELLS. */
  CLUSTER_CELLS: cellList.optional(),
  NATS_URL: z.string().default('nats://127.0.0.1:4222'),
  SKYLINE_WORLD_DIR: z.string().default(repoPath('data/build/yopougon/stages')),
  /** Services process serving GET /api/v1/world-clock. */
  SERVICES_URL: z.url().default('http://127.0.0.1:8080'),
  /** "easting,northing" (UTM 30N metres) of the spawn point; players spawn at the centre of a cell that does not contain it. */
  SPAWN_UTM: z
    .string()
    .regex(/^\d+(\.\d+)?,\d+(\.\d+)?$/)
    .transform((v): UtmPosition => {
      const [eastingM = 0, northingM = 0] = v.split(',').map(Number);
      return { eastingM, northingM };
    })
    .optional(),
  /** Port of the GET /stats endpoint (127.0.0.1 only); 0 disables it. */
  ZONE_STATS_PORT: z.coerce.number().int().min(0).max(65_535).default(0),
});

export interface ZoneConfig {
  readonly cells: readonly string[];
  readonly clusterCells: ReadonlySet<string>;
  readonly natsUrl: string;
  readonly worldDir: string;
  readonly servicesUrl: string;
  readonly spawn: UtmPosition | null;
  readonly statsPort: number;
}

export const readZoneConfig = (env: Record<string, string | undefined>): ZoneConfig => {
  const p = Schema.parse(env);
  return {
    cells: p.ZONE_CELLS,
    clusterCells: new Set([...p.ZONE_CELLS, ...(p.CLUSTER_CELLS ?? [])]),
    natsUrl: p.NATS_URL,
    worldDir: p.SKYLINE_WORLD_DIR,
    servicesUrl: p.SERVICES_URL.replace(/\/$/, ''),
    spawn: p.SPAWN_UTM ?? null,
    statsPort: p.ZONE_STATS_PORT,
  };
};
