/**
 * Role: map of the commune for taxis: the road graph of the pipeline (`08-roads`, routing with `@skyline/sim-transport`) and every typed place with its drop point (`13-places-sites`, first site); missing files ⇒ empty map.
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { UtmPosition } from '@skyline/geo';
import { type GraphEdge, type GraphNode, RoadGraph } from '@skyline/sim-transport';
import { z } from 'zod';

const NodeSchema = z.object({ id: z.string(), position: z.tuple([z.number(), z.number()]) });
const EdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  lengthM: z.number(),
  oneway: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
  cars: z.boolean(),
  pedestrians: z.boolean(),
  geometry: z.array(z.tuple([z.number(), z.number()])),
});
const PlaceSchema = z.object({ id: z.string(), sites: z.array(z.object({ e: z.number(), n: z.number() })) });

export interface CityMap {
  readonly roads: RoadGraph;
  /** Drop point of each typed place (its first action site). */
  readonly places: ReadonlyMap<string, UtmPosition>;
}

const lines = async <T>(file: string, schema: z.ZodType<T>): Promise<T[]> => {
  const raw = await readFile(file, 'utf8').catch(() => '');
  return raw
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => schema.parse(JSON.parse(l)));
};

export const loadCityMap = async (worldDir: string): Promise<CityMap> => {
  const [nodes, edges, placeRows] = await Promise.all([
    lines<GraphNode>(join(worldDir, '08-roads', 'road-nodes.ndjson'), NodeSchema),
    lines<GraphEdge>(join(worldDir, '08-roads', 'road-edges.ndjson'), EdgeSchema),
    lines(join(worldDir, '13-places-sites', 'places-sites.ndjson'), PlaceSchema),
  ]);
  const places = new Map<string, UtmPosition>();
  for (const p of placeRows) {
    const site = p.sites[0];
    if (site) places.set(p.id, { eastingM: site.e, northingM: site.n });
  }
  return { roads: new RoadGraph(nodes, edges), places };
};
