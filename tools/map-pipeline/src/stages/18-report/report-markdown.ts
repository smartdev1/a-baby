/**
 * Role: renders the coverage figures as a Markdown report (tables only — the analysis and recommendations are written by humans in docs/spikes).
 * Owner: backend
 */

import type { RouteRelation } from './bus-routes.ts';
import type { RoadGraphStats } from '../../roads/road-graph-types.ts';
import { type CoverageStats, topEntries } from './coverage-stats.ts';

export interface ReportFacts {
  readonly commune: string;
  readonly snapshot: string;
  readonly boundaryRelation: number | null;
  readonly areaKm2: number | null;
  readonly stats: CoverageStats;
  readonly busRoutes: readonly RouteRelation[] | null;
  /** Building-free L0 tiles inside the boundary, by land cover at their centre. */
  readonly gapTilesByCover: Readonly<Record<string, number>> | null;
  readonly roadGraph: RoadGraphStats;
}

const countBy = <T>(items: readonly T[], keyOf: (item: T) => string): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const item of items) counts[keyOf(item)] = (counts[keyOf(item)] ?? 0) + 1;
  return counts;
};

const pct = (part: number, total: number): string => (total === 0 ? '—' : `${((100 * part) / total).toFixed(1)} %`);
const int = (n: number): string => n.toLocaleString('en-US').replace(/,/g, ' ');
const table = (header: string, rows: [string, string][]): string =>
  [`| ${header} | |`, '|---|---:|', ...rows.map(([a, b]) => `| ${a} | ${b} |`)].join('\n');

export const renderReportMarkdown = ({ commune, snapshot, boundaryRelation, areaKm2, stats, busRoutes, gapTilesByCover, roadGraph }: ReportFacts): string => {
  const roads = topEntries(stats.roadKmByClass, 20).map(([k, km]): [string, string] => [k, `${km.toFixed(1)} km`]);
  const totalKm = Object.values(stats.roadKmByClass).reduce((a, b) => a + b, 0);
  const tilesWithBuildings = Object.keys(stats.buildingsPerTile).length;
  const routes = busRoutes ?? [];
  return [
    `# Coverage report — ${commune}`,
    '',
    `Snapshot: ${snapshot} · Boundary relation: ${boundaryRelation ?? 'none'} · Area: ${areaKm2 === null ? '—' : `${areaKm2.toFixed(1)} km²`}`,
    '',
    '## Summary',
    '',
    table('Measure', [
      ['Features read / inside the commune', `${int(stats.featuresRead)} / ${int(stats.featuresInside)}`],
      ['Buildings', int(stats.buildings)],
      ['… with `height`', `${int(stats.buildingsWithHeight)} (${pct(stats.buildingsWithHeight, stats.buildings)})`],
      ['… with `building:levels`', `${int(stats.buildingsWithLevels)} (${pct(stats.buildingsWithLevels, stats.buildings)})`],
      ['L0 tiles (250 m) with at least one building', int(tilesWithBuildings)],
      ['Roads and paths', `${totalKm.toFixed(1)} km`],
      ['POIs / named', `${int(stats.pois)} / ${int(stats.poisNamed)} (${pct(stats.poisNamed, stats.pois)})`],
      ['Bus / shared-taxi route relations', busRoutes === null ? '—' : int(routes.length)],
    ]),
    '',
    '## Building-free tiles inside the commune',
    '',
    gapTilesByCover === null
      ? 'No boundary: not computed.'
      : table('Land cover at tile centre', topEntries(gapTilesByCover, 10).map(([k, n]) => [k, int(n)])),
    '',
    '`unmapped` = no building and no land-cover polygon: probable OSM gap (or lagoon water drawn only as coastline).',
    '',
    '## Building types (top 15)',
    '',
    table('`building=`', topEntries(stats.buildingTypes, 15).map(([k, n]) => [k, `${int(n)} (${pct(n, stats.buildings)})`])),
    '',
    '## Road length by `highway` class',
    '',
    table('Class', roads),
    '',
    '## POI categories (top 30)',
    '',
    table('Tag', topEntries(stats.poiCategories, 30).map(([k, n]) => [k, int(n)])),
    '',
    '## Road graph',
    '',
    table('Measure', [
      ['Nodes / edges', `${int(roadGraph.nodes)} / ${int(roadGraph.edges)}`],
      ['Routable length', `${roadGraph.lengthKm} km`],
      ['Connected components', int(roadGraph.components)],
      ['Largest component (share of length)', `${(roadGraph.largestComponentShare * 100).toFixed(1)} %`],
      ['Streets with generated sidewalks', int(roadGraph.edgesWithGeneratedSidewalks)],
    ]),
    '',
    '## Route relations by network',
    '',
    routes.length === 0
      ? 'None in the snapshot.'
      : table('`route` · `network`', topEntries(countBy(routes, (r) => `${r.route} · ${r.network ?? '(none)'}`), 30).map(([k, n]) => [k, int(n)])),
    '',
    'Full list (id, ref, name) in `coverage-report.json`. Relations crossing the extract are counted even when most of the route is outside the commune.',
    '',
    '© OpenStreetMap contributors (ODbL).',
    '',
  ].join('\n');
};
