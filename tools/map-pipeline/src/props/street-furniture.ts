/**
 * Role: places street furniture: street lights along streets (by class, alternating sides), kiosks and bus stops at their real OSM points facing the road, a bin next to each kiosk.
 * Owner: backend
 */

import type { ClassifiedRecord } from '../records/map-records.ts';
import type { RoadEdge } from '../roads/road-graph-types.ts';
import type { PlacedInstance } from './placed-instance.ts';
import type { PlacementGuards } from './placement-guards.ts';

/** Spacing in metres and whether lights alternate on both sides. */
const LIGHTING: Readonly<Record<string, { spacingM: number; bothSides: boolean }>> = {
  primary: { spacingM: 30, bothSides: true },
  secondary: { spacingM: 30, bothSides: true },
  tertiary: { spacingM: 35, bothSides: true },
  residential: { spacingM: 40, bothSides: false },
  living_street: { spacingM: 40, bothSides: false },
};
const KERB_OFFSET_M = 1.2;

export const streetLights = (edges: readonly RoadEdge[], guards: PlacementGuards): PlacedInstance[] => {
  const out: PlacedInstance[] = [];
  for (const edge of edges) {
    const rule = LIGHTING[edge.roadClass];
    if (!rule || edge.layer !== 0) continue;
    let along = rule.spacingM / 2;
    let side = 1;
    let walked = 0;
    for (let k = 1; k < edge.geometry.length; k++) {
      const a = edge.geometry[k - 1];
      const b = edge.geometry[k];
      if (!a || !b) continue;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const [ux, uz] = [(b[0] - a[0]) / (len || 1), (b[1] - a[1]) / (len || 1)];
      while (along <= walked + len) {
        const t = along - walked;
        const offset = edge.widthM / 2 + KERB_OFFSET_M;
        const e = a[0] + ux * t + uz * offset * side;
        const n = a[1] + uz * t - ux * offset * side;
        if (guards.free(e, n)) out.push({ module: 'prp_street_light_a', e, n, yawRad: Math.atan2(-uz * side, ux * side), scale: 1, variant: 0 });
        if (rule.bothSides) side = -side;
        along += rule.spacingM;
      }
      walked += len;
    }
  }
  return out;
};

const pointOf = (r: ClassifiedRecord): [number, number] | null => (r.geometry.type === 'Point' ? [r.geometry.coordinates[0], r.geometry.coordinates[1]] : null);

/** Kiosks (+ a bin 2 m away) and bus stops at their real OSM position, facing the nearest road. */
export const pointFurniture = (records: readonly ClassifiedRecord[], guards: PlacementGuards): PlacedInstance[] => {
  const out: PlacedInstance[] = [];
  for (const r of records) {
    const p = pointOf(r);
    if (!p) continue;
    const yawRad = guards.yawTowardsRoad(p[0], p[1]);
    if (r.tags['shop'] === 'kiosk') {
      out.push({ module: 'prp_kiosk_a', e: p[0], n: p[1], yawRad, scale: 1, variant: r.id.length % 8 });
      out.push({ module: 'prp_trash_bin_a', e: p[0] + 2 * Math.cos(yawRad), n: p[1] - 2 * Math.sin(yawRad), yawRad, scale: 1, variant: 0 });
    } else if (r.tags['highway'] === 'bus_stop' || r.tags['public_transport'] === 'platform') {
      out.push({ module: r.tags['shelter'] === 'yes' ? 'prp_bus_stop_shelter_a' : 'prp_bus_stop_sign_a', e: p[0], n: p[1], yawRad, scale: 1, variant: 0 });
    }
  }
  return out;
};
