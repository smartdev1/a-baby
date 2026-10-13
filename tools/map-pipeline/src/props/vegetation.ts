/**
 * Role: places vegetation: OSM trees at their points, seeded jittered grids inside forests, parks and scrub (density in metres), never in buildings or on carriageways.
 * Owner: backend
 */

import type { InstanceModule } from '@skyline/tile-format';
import { rngFor } from '../determinism/seeded-rng.ts';
import type { ClassifiedRecord, UtmRing } from '../records/map-records.ts';
import type { PlacedInstance } from './placed-instance.ts';
import type { PlacementGuards } from './placement-guards.ts';

interface Cover {
  readonly spacingM: number;
  readonly modules: readonly InstanceModule[];
}

const COVERS: readonly [(t: Readonly<Record<string, string>>) => boolean, Cover][] = [
  [(t) => t['natural'] === 'wood' || t['landuse'] === 'forest' || t['leisure'] === 'nature_reserve', { spacingM: 7, modules: ['veg_tree_forest_a', 'veg_tree_forest_a', 'veg_tree_generic_a'] }],
  [(t) => t['leisure'] === 'park' || t['leisure'] === 'garden', { spacingM: 14, modules: ['veg_tree_mango_a', 'veg_tree_generic_a', 'veg_tree_palm_a'] }],
  [(t) => t['natural'] === 'scrub', { spacingM: 9, modules: ['veg_bush_a'] }],
];
/** Safety cap per polygon (huge forests stay bounded; tiles also have budgets). */
const MAX_PER_POLYGON = 60_000;

const inRings = (rings: readonly UtmRing[], e: number, n: number): boolean => {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i] ?? [0, 0];
      const [xj, zj] = ring[j] ?? [0, 0];
      if (zi > n !== zj > n && e < ((xj - xi) * (n - zi)) / (zj - zi) + xi) inside = !inside;
    }
  }
  return inside;
};

const fillPolygon = (record: ClassifiedRecord, cover: Cover, ctx: { seed: string; guards: PlacementGuards }): PlacedInstance[] => {
  if (record.geometry.type !== 'MultiPolygon') return [];
  const out: PlacedInstance[] = [];
  const rng = rngFor(ctx.seed, record.id);
  for (const rings of record.geometry.coordinates) {
    const pts = rings.flat();
    const [minE, minN] = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
    const [maxE, maxN] = [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
    for (let n = minN; n < maxN && out.length < MAX_PER_POLYGON; n += cover.spacingM) {
      for (let e = minE; e < maxE && out.length < MAX_PER_POLYGON; e += cover.spacingM) {
        const pe = e + rng.next() * cover.spacingM;
        const pn = n + rng.next() * cover.spacingM;
        const module = rng.pick(cover.modules);
        const yawRad = rng.next() * Math.PI * 2;
        const scale = 0.8 + rng.next() * 0.5;
        if (inRings(rings, pe, pn) && ctx.guards.free(pe, pn)) out.push({ module, e: pe, n: pn, yawRad, scale, variant: rng.int(0, 7) });
      }
    }
  }
  return out;
};

export const vegetation = (records: readonly ClassifiedRecord[], ctx: { seed: string; guards: PlacementGuards }): PlacedInstance[] => {
  const out: PlacedInstance[] = [];
  for (const r of records) {
    if (r.tags['natural'] === 'tree' && r.geometry.type === 'Point') {
      const rng = rngFor(ctx.seed, r.id);
      const [e, n] = r.geometry.coordinates;
      out.push({ module: rng.pick(['veg_tree_mango_a', 'veg_tree_generic_a', 'veg_tree_palm_a'] as const), e, n, yawRad: rng.next() * Math.PI * 2, scale: 0.9 + rng.next() * 0.4, variant: rng.int(0, 7) });
      continue;
    }
    const cover = COVERS.find(([test]) => test(r.tags))?.[1];
    if (cover) out.push(...fillPolygon(r, cover, ctx));
  }
  return out;
};
