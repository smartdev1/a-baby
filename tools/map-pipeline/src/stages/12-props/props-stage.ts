/**
 * Role: stage 12-props: street furniture and vegetation of the commune as placed instances (props.ndjson), guarded against buildings and carriageways.
 * Owner: backend
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PlacedInstance } from '../../props/placed-instance.ts';
import { PlacementGuards } from '../../props/placement-guards.ts';
import { pointFurniture, streetLights } from '../../props/street-furniture.ts';
import { vegetation } from '../../props/vegetation.ts';
import type { BuildingRecord, ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { RoadEdge } from '../../roads/road-graph-types.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';
import { BUILDINGS_FILE, HEIGHTS_STAGE_ID } from '../06-heights/heights-stage.ts';
import { ROADS_STAGE_ID } from '../08-roads/roads-stage.ts';

export const PROPS_STAGE_ID = '12-props';
export const PROPS_FILE = 'props.ndjson';

const collect = async <T>(path: string, keep: (v: T) => boolean = () => true): Promise<T[]> => {
  const out: T[] = [];
  for await (const v of readNdjson<T>(path)) if (keep(v)) out.push(v);
  return out;
};

export const propsStage: PipelineStage = {
  id: PROPS_STAGE_ID,
  // Bump when props/*.ts change their output.
  version: 1,
  outputs: [PROPS_FILE, 'props-report.json'],
  inputFiles: (ctx) => [ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE), ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE), ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson')],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    const buildings = await collect<BuildingRecord>(ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE));
    const edges = await collect<RoadEdge>(ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'));
    const records = await collect<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE), (r) => !r.isBuilding && !r.roadClass);
    const guards = new PlacementGuards(buildings, edges.filter((e) => e.cars));

    const placed: PlacedInstance[] = [...streetLights(edges, guards), ...pointFurniture(records, guards), ...vegetation(records, { seed: ctx.config.seed, guards })];
    const byModule: Record<string, number> = {};
    for (const p of placed) byModule[p.module] = (byModule[p.module] ?? 0) + 1;
    await writeNdjson(join(outDir, PROPS_FILE), placed);
    await writeFile(join(outDir, 'props-report.json'), `${JSON.stringify({ instances: placed.length, byModule }, null, 2)}\n`);
    ctx.logger.info({ instances: placed.length }, 'props and vegetation placed');
  },
};
