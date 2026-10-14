/**
 * Role: turns OSM route relations (OPL with their referenced stop nodes) into game transit lines: mode, ref, name, ordered stops in UTM and a path on the road graph; lines with too few stops or a mostly missing path are rejected with a reason.
 * Owner: backend
 */

import { toUtm30n } from '@skyline/geo';
import type { OplObject } from '../osm/opl-format.ts';
import type { UtmPoint } from '../records/map-records.ts';
import type { RoadEdge } from '../roads/road-graph-types.ts';
import { linePath } from './line-path.ts';
import { type TransitMode, transitModeOf } from './line-mode.ts';

export interface TransitStop {
  /** `osm:node/123` */
  readonly id: string;
  readonly name: string | null;
  readonly position: UtmPoint;
}

export interface TransitLine {
  /** `osm:relation/123` */
  readonly id: string;
  readonly mode: TransitMode;
  readonly ref: string | null;
  /** Public transport names are real (ADR 0010: public places keep their name). */
  readonly name: string | null;
  readonly network: string | null;
  readonly stops: readonly TransitStop[];
  readonly path: readonly UtmPoint[];
  readonly lengthM: number;
  readonly gapsM: number;
}

export type Rejection = { readonly id: string; readonly reason: 'too_few_stops' | 'path_missing' | 'path_broken' };

const STOP_ROLES = /^(stop|platform)(_entry_only|_exit_only)?$/;
/** A path with more than this many metres of jumps is broken. */
const MAX_GAPS_M = 500;

const osmId = (ref: string): string => `osm:${ref[0] === 'n' ? 'node' : ref[0] === 'w' ? 'way' : 'relation'}/${ref.slice(1)}`;

const stopsOf = (relation: OplObject, nodes: ReadonlyMap<string, OplObject>): TransitStop[] => {
  const stops: TransitStop[] = [];
  for (const m of relation.members) {
    const node = m.type === 'n' && STOP_ROLES.test(m.role) ? nodes.get(m.ref) : undefined;
    if (!node || node.lon === null || node.lat === null) continue;
    const id = osmId(m.ref);
    if (stops.at(-1)?.id === id) continue;
    const utm = toUtm30n({ lonDeg: node.lon, latDeg: node.lat });
    stops.push({ id, name: node.tags['name'] ?? null, position: [Math.round(utm.eastingM * 100) / 100, Math.round(utm.northingM * 100) / 100] });
  }
  return stops;
};

export const buildTransitLines = (objects: readonly OplObject[], edgesByWay: ReadonlyMap<string, readonly RoadEdge[]>): { lines: TransitLine[]; rejected: Rejection[] } => {
  const nodes = new Map(objects.filter((o) => o.id.startsWith('n')).map((o) => [o.id, o]));
  const lines: TransitLine[] = [];
  const rejected: Rejection[] = [];
  for (const relation of objects.filter((o) => o.id.startsWith('r'))) {
    const id = osmId(relation.id);
    const stops = stopsOf(relation, nodes);
    const ways = relation.members.filter((m) => m.type === 'w' && !STOP_ROLES.test(m.role)).map((m) => osmId(m.ref));
    const path = linePath(ways, edgesByWay);
    if (stops.length < 2) rejected.push({ id, reason: 'too_few_stops' });
    else if (path.polyline.length < 2 || path.missingWays > ways.length / 2) rejected.push({ id, reason: 'path_missing' });
    else if (path.gapsM > MAX_GAPS_M) rejected.push({ id, reason: 'path_broken' });
    else {
      const t = relation.tags;
      lines.push({ id, mode: transitModeOf(t), ref: t['ref'] ?? null, name: t['name'] ?? null, network: t['network'] ?? null, stops, path: path.polyline, lengthM: path.lengthM, gapsM: path.gapsM });
    }
  }
  return { lines: lines.sort((a, b) => (a.id < b.id ? -1 : 1)), rejected: rejected.sort((a, b) => (a.id < b.id ? -1 : 1)) };
};
