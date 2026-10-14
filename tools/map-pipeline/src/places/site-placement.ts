/**
 * Role: positions the action sites of a typed place: inside its building footprint, on its street side (towards the nearest road, just outside the building) or around a street place, seeded per place so builds are reproducible.
 * Owner: backend
 */

import type { PlaceType } from '@skyline/content-schema';
import type { SeededRng } from '../determinism/seeded-rng.ts';
import type { PlacementGuards } from '../props/placement-guards.ts';
import type { UtmPoint, UtmRing } from '../records/map-records.ts';

export interface PlacedSite {
  readonly kind: string;
  readonly capacity: number;
  readonly e: number;
  readonly n: number;
  /** Direction the actor faces when using the site. */
  readonly yawRad: number;
}

const STEP_M = 0.5;
const MAX_WALK_M = 60;
/** Distance kept from the facade for street-side sites. */
const FRONT_OFFSET_M = 1.5;

const centroid = (ring: UtmRing): UtmPoint => {
  const pts = ring.length > 1 ? ring.slice(0, -1) : ring;
  return [pts.reduce((s, p) => s + p[0], 0) / Math.max(1, pts.length), pts.reduce((s, p) => s + p[1], 0) / Math.max(1, pts.length)];
};

const round = (v: number): number => Math.round(v * 100) / 100;
const normYaw = (yaw: number): number => Math.round(Math.atan2(Math.sin(yaw), Math.cos(yaw)) * 1000) / 1000;

/** From inside a building, walks towards the road until outside the footprint, then keeps an offset from the facade. */
const streetSide = (from: UtmPoint, yaw: number, guards: PlacementGuards): UtmPoint => {
  const [dx, dn] = [Math.sin(yaw), Math.cos(yaw)];
  let d = 0;
  while (d < MAX_WALK_M && guards.insideBuilding(from[0] + dx * d, from[1] + dn * d)) d += STEP_M;
  return [from[0] + dx * (d + FRONT_OFFSET_M), from[1] + dn * (d + FRONT_OFFSET_M)];
};

/** A typed place and its sites (UTM metres): one line of places-sites.ndjson. */
export interface PlaceSites {
  readonly id: string;
  readonly placeType: string;
  readonly sites: readonly PlacedSite[];
}

export interface PlaceToSite {
  readonly point: UtmPoint;
  readonly type: PlaceType;
  /** Outer ring when the place is a building itself. */
  readonly footprint: UtmRing | null;
}

export const placeSites = ({ point, type, footprint }: PlaceToSite, guards: PlacementGuards, rng: SeededRng): PlacedSite[] => {
  const inBuilding = guards.insideBuilding(point[0], point[1]);
  const towardsRoad = guards.yawTowardsRoad(point[0], point[1]);
  // Inside sites need a point in the building: the place point, else the centre of the place's own footprint.
  const indoor: UtmPoint = inBuilding || !footprint ? point : centroid(footprint);
  return type.sites.map((site, k) => {
    let at: UtmPoint;
    let yawRad = towardsRoad + Math.PI;
    if (site.placement === 'inside') {
      at = indoor;
      yawRad = towardsRoad;
    } else if (site.placement === 'front') {
      const base = guards.insideBuilding(indoor[0], indoor[1]) ? streetSide(indoor, towardsRoad, guards) : point;
      // Several front sites of one place stand side by side along the facade.
      const side = (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * 2.5;
      at = [base[0] + Math.cos(towardsRoad) * side, base[1] - Math.sin(towardsRoad) * side];
    } else {
      const angle = rng.next() * Math.PI * 2;
      const r = 1 + rng.next() * 2;
      at = [point[0] + Math.sin(angle) * r, point[1] + Math.cos(angle) * r];
    }
    return { kind: site.kind, capacity: site.capacity, e: round(at[0]), n: round(at[1]), yawRad: normYaw(yawRad) };
  });
};
