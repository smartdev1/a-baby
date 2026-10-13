/**
 * Role: per-tile budgets of ARCHITECTURE §10.4 (compressed size, triangles, draw calls); a tile over the maximum fails the build with its key.
 * Owner: backend
 */

import type { EncodedTile } from './tile-encoder.ts';

export const TILE_BUDGET_MAX = { bytes: 1.5 * 1024 * 1024, triangles: 400_000, drawCalls: 40 } as const;

export const tileBytes = (t: EncodedTile): number => t.geom.bytes.length + t.collision.bytes.length + t.meta.bytes.length + (t.instances?.bytes.length ?? 0);

/** Returns the budget violations of a tile (empty when within budget). */
export const budgetViolations = (t: EncodedTile): string[] => {
  const problems: string[] = [];
  if (tileBytes(t) > TILE_BUDGET_MAX.bytes) problems.push(`${tileBytes(t)} bytes > ${TILE_BUDGET_MAX.bytes}`);
  if (t.triangles > TILE_BUDGET_MAX.triangles) problems.push(`${t.triangles} triangles > ${TILE_BUDGET_MAX.triangles}`);
  if (t.drawCalls > TILE_BUDGET_MAX.drawCalls) problems.push(`${t.drawCalls} draw calls > ${TILE_BUDGET_MAX.drawCalls}`);
  return problems.map((p) => `tile ${t.key} over budget: ${p}`);
};
