/**
 * Role: tests the generated-world statistics: distributions per level, tiles above 80 % of a budget maximum, instance families, Markdown rendering.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { TILE_BUDGET_MAX } from '../encoding/tile-budgets.ts';
import { renderWorldReport } from './world-report-markdown.ts';
import { distribution, worldStats } from './world-stats.ts';

const index = {
  L0_1_1: { bytes: 100_000, triangles: 5000, drawCalls: 12, instanceCount: 300 },
  L0_2_1: { bytes: 300_000, triangles: 9000, drawCalls: 35, instanceCount: 900 },
  L1_0_0: { bytes: 50_000, triangles: 2000 },
  L2_0_0: { bytes: TILE_BUDGET_MAX.bytes * 0.9, triangles: 3000 },
};
const content = {
  props: { instances: 3, byModule: { prp_street_light_a: 2, veg_tree_mango_a: 1 } },
  facades: { buildings: 10, withFacades: 9, instances: 50, pitchedRoofs: 4, byProfile: { courtyard: 8, apartments: 2 } },
  naming: { places: 5, bySource: { toponym: 2, generic: 3 } },
  facadeModules: { bld_parapet_a: 20, bld_gf_window_a: 30 },
};

describe('worldStats', () => {
  it('should summarise each level and list the tiles above 80 % of a budget maximum', () => {
    const s = worldStats(index, content);
    expect(s.levels.map((l) => [l.level, l.tiles])).toEqual([
      ['L0', 2],
      ['L1', 1],
      ['L2', 1],
    ]);
    expect(s.levels[0]?.drawCalls).toEqual({ mean: 23.5, p95: 35, max: 35 });
    expect(s.levels[1]?.drawCalls).toBeNull();
    expect(s.warnings.map((w) => [w.tile, w.measure])).toEqual([
      ['L2_0_0', 'bytes'],
      ['L0_2_1', 'drawCalls'],
    ]);
    expect(s.content.instancesByFamily).toEqual({ prp: 2, veg: 1, bld: 50 });
  });

  it('should compute an empty distribution and render the report', () => {
    expect(distribution([])).toEqual({ mean: 0, p95: 0, max: 0 });
    const md = renderWorldReport('Test', worldStats(index, content));
    expect(md).toContain('| L0 | 2 |');
    expect(md).toContain('| L2_0_0 | bytes |');
    expect(md).toContain('Facades: 9 of 10 buildings');
  });
});
