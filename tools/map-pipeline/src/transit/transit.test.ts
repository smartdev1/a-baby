/**
 * Role: tests transit lines: OPL parsing (tags, coordinates, members), mode from network names, paths chained and oriented across ways with gaps measured, lines rejected for too few stops or a missing path.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { parseOplLine } from '../osm/opl-format.ts';
import type { RoadEdge } from '../roads/road-graph-types.ts';
import { linePath, wayPolyline } from './line-path.ts';
import { transitModeOf } from './line-mode.ts';
import { buildTransitLines } from './transit-lines.ts';

const edge = ([id, wayId, from, to]: [string, RoadEdge["wayId"], string, string], geometry: [number, number][]): RoadEdge => ({
  id, wayId, from, to, roadClass: 'primary', lengthM: 100, widthM: 10, oneway: 0, cars: true, pedestrians: true, sidewalks: 'none', layer: 0, geometry,
});

/** Way 1 goes west → east (two edges), way 2 is stored east → west and must be reversed. */
const edgesByWay = new Map<string, RoadEdge[]>([
  ['osm:way/1', [edge(['e2', 'osm:way/1', 'b', 'c'], [[100, 0], [200, 0]]), edge(['e1', 'osm:way/1', 'a', 'b'], [[0, 0], [100, 0]])]],
  ['osm:way/2', [edge(['e3', 'osm:way/2', 'd', 'c'], [[300, 0], [200, 0]])]],
]);

describe('OPL and modes', () => {
  it('should read tags, coordinates and members', () => {
    expect(parseOplLine('n42 Tname=Gare%20%Sud,highway=bus_stop x-4.06 y5.33')).toMatchObject({ id: 'n42', tags: { name: 'Gare Sud' }, lon: -4.06, lat: 5.33 });
    expect(parseOplLine('r7 Troute=bus Mn42@stop,w1@,w2@,n43@platform')?.members).toEqual([
      { type: 'n', ref: 'n42', role: 'stop' },
      { type: 'w', ref: 'w1', role: '' },
      { type: 'w', ref: 'w2', role: '' },
      { type: 'n', ref: 'n43', role: 'platform' },
    ]);
    expect(parseOplLine('# comment')).toBeNull();
  });

  it('should name the mode from the network', () => {
    expect(transitModeOf({ route: 'bus', network: "Gbaka d'Adjamé" })).toBe('gbaka');
    expect(transitModeOf({ route: 'bus', network: 'Woro-woro de Yopougon' })).toBe('woro_woro');
    expect(transitModeOf({ route: 'share_taxi' })).toBe('woro_woro');
    expect(transitModeOf({ route: 'bus', network: 'monbus' })).toBe('sotra_bus');
    expect(transitModeOf({ route: 'bus' })).toBe('bus');
  });
});

describe('line paths', () => {
  it('should chain the edges of a way and orient the next ways', () => {
    expect(wayPolyline(edgesByWay.get('osm:way/1') ?? [])).toEqual([[0, 0], [100, 0], [200, 0]]);
    const path = linePath(['osm:way/1', 'osm:way/2', 'osm:way/9'], edgesByWay);
    expect(path.polyline).toEqual([[0, 0], [100, 0], [200, 0], [300, 0]]);
    expect(path).toMatchObject({ lengthM: 300, missingWays: 1, gapsM: 0 });
    expect(linePath(['osm:way/2', 'osm:way/1'], edgesByWay).polyline).toEqual([[300, 0], [200, 0], [100, 0], [0, 0]]);
  });

  it('should keep lines with stops and a path, and reject the others with a reason', () => {
    const objects = [
      'n42 Tname=A x-4.06 y5.33',
      'n43 Tname=B x-4.05 y5.33',
      'r7 Troute=bus,network=monbus,ref=06,name=Bus%20%06 Mn42@stop,w1@,w2@,n43@stop',
      'r8 Troute=bus Mn42@stop,w1@',
      'r9 Troute=bus Mn42@stop,n43@stop,w5@,w6@',
    ].flatMap((l) => parseOplLine(l) ?? []);
    const { lines, rejected } = buildTransitLines(objects, edgesByWay);
    expect(lines.map((l) => [l.id, l.mode, l.ref, l.stops.length, l.lengthM])).toEqual([['osm:relation/7', 'sotra_bus', '06', 2, 300]]);
    expect(rejected).toEqual([
      { id: 'osm:relation/8', reason: 'too_few_stops' },
      { id: 'osm:relation/9', reason: 'path_missing' },
    ]);
  });
});
