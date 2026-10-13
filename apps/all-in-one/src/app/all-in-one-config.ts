/**
 * Role: configuration of the all-in-one process from environment variables (ports, pipeline release folder, spawn point in Yopougon).
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const repoPath = (relative: string): string => fileURLToPath(new URL(`../../../../${relative}`, import.meta.url));

const Schema = z.object({
  GATEWAY_PORT: z.coerce.number().int().min(0).max(65_535).default(2567),
  /** Folder holding `16-encode/` and `17-manifest/` of a pipeline release. */
  SKYLINE_WORLD_DIR: z.string().default(repoPath('data/build/yopougon/stages')),
  /** "lon,lat" of the spawn point; default = Pigeons area, Yopougon. */
  SKYLINE_SPAWN_LONLAT: z
    .string()
    .default('-4.0681,5.329')
    .transform((v, ctx) => {
      const [lon, lat] = v.split(',').map(Number);
      if (lon === undefined || lat === undefined || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        ctx.addIssue({ code: 'custom', message: 'expected "lon,lat"' });
        return z.NEVER;
      }
      return { lonDeg: lon, latDeg: lat };
    }),
});

export interface AllInOneConfig {
  readonly gatewayPort: number;
  readonly worldDir: string;
  readonly spawn: { readonly lonDeg: number; readonly latDeg: number };
}

export const readAllInOneConfig = (env: Record<string, string | undefined>): AllInOneConfig => {
  const parsed = Schema.parse(env);
  return { gatewayPort: parsed.GATEWAY_PORT, worldDir: parsed.SKYLINE_WORLD_DIR, spawn: parsed.SKYLINE_SPAWN_LONLAT };
};
