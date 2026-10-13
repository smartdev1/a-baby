/**
 * Role: stage 08-roads: road and pedestrian graph of the commune (nodes, edges with class/width/oneway/access/sidewalks), per-tile edge index and network statistics.
 * Owner: backend
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import { buildRoadGraph, routableWays } from '../../roads/build-road-graph.ts';
import { componentStats } from '../../roads/graph-components.ts';
import { isPathClass } from '../../roads/road-classes.ts';
import type { RoadEdge, RoadGraphStats } from '../../roads/road-graph-types.ts';
import { FootwayIndex, sidewalksFor } from '../../roads/sidewalks.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { boundsOfPoints, tilesOverlapping } from '../../tiling/tile-frame.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';

export const ROADS_STAGE_ID = '08-roads';
export const ROAD_STATS_FILE = 'road-stats.json';
const OUTPUTS = ['road-nodes.ndjson', 'road-edges.ndjson', 'road-tiles.json', ROAD_STATS_FILE] as const;

const tileIndex = (edges: readonly RoadEdge[]): Record<string, string[]> => {
  const index: Record<string, string[]> = {};
  for (const edge of edges) for (const key of tilesOverlapping(boundsOfPoints(edge.geometry))) (index[key] ??= []).push(edge.id);
  return Object.fromEntries(Object.entries(index).sort(([a], [b]) => (a < b ? -1 : 1)));
};

export const roadsStage: PipelineStage = {
  id: ROADS_STAGE_ID,
  // Bump when roads/*.ts change their output.
  version: 1,
  outputs: OUTPUTS,
  inputFiles: (ctx) => [ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE)],
  params: () => ({}),
  run: async (ctx, outDir) => {
    const records: ClassifiedRecord[] = [];
    for await (const r of readNdjson<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE))) if (r.roadClass) records.push(r);
    const tagsByWay = new Map(records.map((r) => [r.id, r.tags]));
    const graph = buildRoadGraph(routableWays(records));
    const footways = new FootwayIndex(graph.edges.filter((e) => isPathClass(e.roadClass) && e.roadClass !== 'track'));

    let generated = 0;
    const edges: RoadEdge[] = graph.edges.map((edge) => {
      const decision = sidewalksFor(edge, tagsByWay.get(edge.wayId) ?? {}, footways);
      if (decision.generated) generated++;
      return { ...edge, sidewalks: decision.sidewalks };
    });
    const { components, largestShare } = componentStats(graph.nodes, edges);
    const stats: RoadGraphStats = {
      nodes: graph.nodes.length,
      edges: edges.length,
      lengthKm: Math.round(edges.reduce((s, e) => s + e.lengthM, 0) / 100) / 10,
      components,
      largestComponentShare: Math.round(largestShare * 1000) / 1000,
      edgesWithGeneratedSidewalks: generated,
    };

    await writeNdjson(join(outDir, 'road-nodes.ndjson'), graph.nodes);
    await writeNdjson(join(outDir, 'road-edges.ndjson'), edges);
    await writeFile(join(outDir, 'road-tiles.json'), `${JSON.stringify(tileIndex(edges))}\n`);
    await writeFile(join(outDir, ROAD_STATS_FILE), `${JSON.stringify(stats, null, 2)}\n`);
    ctx.logger.info(stats, 'road graph built');
  },
};
