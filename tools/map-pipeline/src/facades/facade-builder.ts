/**
 * Role: turns one building into facade bay instances (ground floor, upper-floor columns, entrance, parapet) and roof accessories, with a seeded tint per building and dirt per bay.
 * Owner: backend
 */

import type { InstanceModule } from '@skyline/tile-format';
import type { SeededRng } from '../determinism/seeded-rng.ts';
import type { PlacedInstance } from '../props/placed-instance.ts';
import type { UtmPoint, UtmRing } from '../records/map-records.ts';
import { entranceBay, groundBay, upperColumn } from './facade-grammar.ts';
import type { FacadeProfile } from './facade-profile.ts';
import { orientedRect, type Roof } from './roof-choice.ts';
import { type FloorLayout, NOMINAL_BAY_M, type WallBays, wallBays } from './wall-layout.ts';

export interface FacadeContext {
  readonly profile: FacadeProfile;
  readonly baseYM: number;
  readonly heightM: number;
  readonly floors: FloorLayout;
  readonly roof: Roof;
  /** Is there a road in front of this wall point (outward)? */
  readonly streetAt: (e: number, n: number, nx: number, nz: number) => boolean;
  readonly rng: SeededRng;
}

interface Wall {
  readonly a: UtmPoint;
  readonly dir: UtmPoint;
  readonly normal: UtmPoint;
  readonly bays: WallBays;
  readonly street: boolean;
}

const ROOF_ODDS: Readonly<Record<FacadeProfile, { tank: number; rebar: number }>> = {
  apartments: { tank: 0.6, rebar: 0.15 },
  courtyard: { tank: 0.35, rebar: 0.45 },
  commercial: { tank: 0.4, rebar: 0.3 },
  public: { tank: 0.3, rebar: 0 },
  industrial: { tank: 0.1, rebar: 0 },
};

const signedArea = (ring: UtmRing): number => {
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) twice += (ring[j]?.[0] ?? 0) * (ring[i]?.[1] ?? 0) - (ring[i]?.[0] ?? 0) * (ring[j]?.[1] ?? 0);
  return twice / 2;
};

/** Open, counter-clockwise ring: the outward normal of edge a→b is (dz, −dx). */
export const outerWalls = (ring: UtmRing, ctx: Pick<FacadeContext, 'streetAt'>): Wall[] => {
  const closed = ring.length > 1 && ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1];
  const open = closed ? ring.slice(0, -1) : [...ring];
  const ccw = signedArea(open) > 0 ? open : open.reverse();
  const walls: Wall[] = [];
  ccw.forEach((a, k) => {
    const b = ccw[(k + 1) % ccw.length] ?? a;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const bays = wallBays(len);
    if (!bays) return;
    const dir: UtmPoint = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const normal: UtmPoint = [dir[1], -dir[0]];
    walls.push({ a, dir, normal, bays, street: ctx.streetAt(a[0] + (dir[0] * len) / 2, a[1] + (dir[1] * len) / 2, normal[0], normal[1]) });
  });
  return walls;
};

const variantOf = (tint: number, dirt: number): number => (tint & 15) | (Math.min(15, dirt) << 4);

const bay = (wall: Wall, column: number, module: InstanceModule, fit: { yM: number; stretchY: number; variant: number }): PlacedInstance => ({
  module,
  e: wall.a[0] + wall.dir[0] * (column + 0.5) * wall.bays.widthM,
  n: wall.a[1] + wall.dir[1] * (column + 0.5) * wall.bays.widthM,
  yawRad: Math.atan2(wall.normal[0], wall.normal[1]),
  scale: 1,
  variant: fit.variant,
  yM: Math.round(fit.yM * 100) / 100,
  stretchX: wall.bays.widthM / NOMINAL_BAY_M,
  stretchY: fit.stretchY,
});

/** The entrance goes on the longest street wall, or the longest wall. */
const entranceWall = (walls: readonly Wall[]): Wall | undefined => {
  const byLength = [...walls].sort((x, y) => y.bays.widthM * y.bays.count - x.bays.widthM * x.bays.count);
  return byLength.find((w) => w.street) ?? byLength[0];
};

const wallInstances = (wall: Wall, ctx: FacadeContext, look: { tint: number; entrance: boolean }): PlacedInstance[] => {
  const { floors, rng, profile, baseYM } = ctx;
  const out: PlacedInstance[] = [];
  const door = entranceBay(profile);
  for (let column = 0; column < wall.bays.count; column++) {
    const isEntrance = look.entrance && door !== null && column === Math.floor(wall.bays.count / 2);
    const ground = isEntrance && door ? door : groundBay(profile, wall.street, rng);
    out.push(bay(wall, column, ground, { yM: baseYM, stretchY: floors.groundM / 3.5, variant: variantOf(look.tint, 4 + rng.int(0, 6)) }));
    const upper = upperColumn(profile, wall.street, rng);
    for (let f = 0; f < floors.upperCount; f++) {
      out.push(bay(wall, column, upper, { yM: baseYM + floors.groundM + f * floors.upperM, stretchY: floors.upperM / 3, variant: variantOf(look.tint, rng.int(0, 5)) }));
    }
    if (ctx.roof.kind === 'flat') out.push(bay(wall, column, 'bld_parapet_a', { yM: baseYM + ctx.heightM, stretchY: 1, variant: variantOf(look.tint, rng.int(2, 8)) }));
  }
  return out;
};

const pointInRing = (ring: UtmRing, [e, n]: UtmPoint): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i] ?? [0, 0];
    const [xj, zj] = ring[j] ?? [0, 0];
    if (zi > n !== zj > n && e < ((xj - xi) * (n - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

/** Water tank near the middle and rebar at a few corners of flat roofs. */
const roofAccessories = (ring: UtmRing, ctx: FacadeContext): PlacedInstance[] => {
  const rect = orientedRect(ring);
  if (ctx.roof.kind !== 'flat' || !rect || rect.halfLong * rect.halfShort * 4 < 30) return [];
  const odds = ROOF_ODDS[ctx.profile];
  const yM = Math.round((ctx.baseYM + ctx.heightM) * 100) / 100;
  const yawRad = Math.atan2(rect.axis[0], rect.axis[1]);
  const out: PlacedInstance[] = [];
  if (ctx.rng.next() < odds.tank && pointInRing(ring, rect.centre)) out.push({ module: 'bld_roof_water_tank_a', e: rect.centre[0], n: rect.centre[1], yawRad, scale: 1, variant: ctx.rng.int(0, 3), yM });
  if (ctx.rng.next() < odds.rebar) {
    for (const [e, n] of ring.slice(0, 4)) {
      const [dx, dz] = [rect.centre[0] - e, rect.centre[1] - n];
      const d = Math.hypot(dx, dz) || 1;
      out.push({ module: 'bld_roof_rebar_a', e: e + (dx / d) * 0.5, n: n + (dz / d) * 0.5, yawRad, scale: 1, variant: ctx.rng.int(0, 3), yM });
    }
  }
  return out;
};

/** Every outer ring of the footprint gets bays; courtyard walls (holes) stay blank geometry. */
export const buildFacades = (outerRings: readonly UtmRing[], ctx: FacadeContext): PlacedInstance[] => {
  const tint = ctx.rng.int(0, 15);
  const walls = outerRings.map((ring) => outerWalls(ring, ctx));
  const entrance = entranceWall(walls.flat());
  const facades = walls.flat().flatMap((wall) => wallInstances(wall, ctx, { tint, entrance: wall === entrance }));
  return [...facades, ...outerRings.flatMap((ring) => roofAccessories(ring, ctx))];
};
