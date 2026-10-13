/**
 * Role: stage 11-facades-roofs: facade bay and roof accessory instances of every building (facades.ndjson) and the pitched sheet-metal roofs (roofs.ndjson), seeded per building.
 * Owner: backend
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rngFor } from '../../determinism/seeded-rng.ts';
import { buildFacades } from '../../facades/facade-builder.ts';
import { facadeProfileOf, type FacadeProfile } from '../../facades/facade-profile.ts';
import { chooseRoof, type PitchedRoof } from '../../facades/roof-choice.ts';
import { floorLayout } from '../../facades/wall-layout.ts';
import type { OsmId } from '../../osm/osm-id.ts';
import { PlacementGuards } from '../../props/placement-guards.ts';
import type { PlacedInstance } from '../../props/placed-instance.ts';
import type { BuildingRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { RoadEdge } from '../../roads/road-graph-types.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { TerrainSampler } from '../../terrain/terrain-sampler.ts';
import type { TileTerrain } from '../../terrain/tile-terrain.ts';
import { boundsOfPoints, tilesOverlapping } from '../../tiling/tile-frame.ts';
import { BUILDINGS_FILE, HEIGHTS_STAGE_ID } from '../06-heights/heights-stage.ts';
import { ROADS_STAGE_ID } from '../08-roads/roads-stage.ts';
import { TERRAIN_FILE, TERRAIN_STAGE_ID } from '../10-terrain/terrain-stage.ts';

export const FACADES_STAGE_ID = '11-facades-roofs';
export const FACADES_FILE = 'facades.ndjson';
export const ROOFS_FILE = 'roofs.ndjson';

/** A pitched roof keyed by its building. */
export interface BuildingRoof {
  readonly id: OsmId;
  readonly roof: PitchedRoof;
}

/** A road this close in front of a wall makes it a street wall. */
const STREET_PROBE_M = 6;
const STREET_RADIUS_M = 6;

interface FacadeStats {
  buildings: number;
  withFacades: number;
  instances: number;
  pitchedRoofs: number;
  byProfile: Record<string, number>;
  byModule: Record<string, number>;
}

const facadesOf = (b: BuildingRecord, deps: { seed: string; ground: TerrainSampler; guards: PlacementGuards }): { instances: PlacedInstance[]; roof: PitchedRoof | null; profile: FacadeProfile } => {
  const rng = rngFor(deps.seed, `facade:${b.id}`);
  const profile = facadeProfileOf(b);
  const polygons = b.footprint.coordinates;
  const outerRings = polygons.map((p) => p[0] ?? []).filter((r) => r.length >= 4);
  const simple = polygons.length === 1 && polygons[0]?.length === 1 ? (outerRings[0] ?? null) : null;
  const roof = chooseRoof({ profile, levels: b.levels, simpleRing: simple, insideOneTile: tilesOverlapping(boundsOfPoints(polygons.flat(2))).length === 1 }, rng);
  const floors = floorLayout(b.heightM);
  if (!floors) return { instances: [], roof: roof.kind === 'flat' ? null : roof, profile };
  const streetAt = (e: number, n: number, nx: number, nz: number): boolean => deps.guards.roadWithin(e + nx * STREET_PROBE_M, n + nz * STREET_PROBE_M, STREET_RADIUS_M);
  const instances = buildFacades(outerRings, { profile, baseYM: deps.ground.baseUnder(polygons[0]?.[0] ?? []), heightM: b.heightM, floors, roof, streetAt, rng });
  return { instances, roof: roof.kind === 'flat' ? null : roof, profile };
};

export const facadesRoofsStage: PipelineStage = {
  id: FACADES_STAGE_ID,
  // Bump when facades/*.ts change their output.
  version: 1,
  outputs: [FACADES_FILE, ROOFS_FILE, 'facades-report.json'],
  inputFiles: (ctx) => [ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE), ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'), ctx.outputOf(TERRAIN_STAGE_ID, TERRAIN_FILE)],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    const terrain = new Map<string, TileTerrain>();
    for await (const t of readNdjson<TileTerrain>(ctx.outputOf(TERRAIN_STAGE_ID, TERRAIN_FILE))) terrain.set(t.key, t);
    const cars: RoadEdge[] = [];
    for await (const e of readNdjson<RoadEdge>(ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'))) if (e.cars) cars.push(e);
    const deps = { seed: ctx.config.seed, ground: new TerrainSampler(terrain), guards: new PlacementGuards([], cars) };

    const stats: FacadeStats = { buildings: 0, withFacades: 0, instances: 0, pitchedRoofs: 0, byProfile: {}, byModule: {} };
    const instances: PlacedInstance[] = [];
    const roofs: BuildingRoof[] = [];
    for await (const b of readNdjson<BuildingRecord>(ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE))) {
      const out = facadesOf(b, deps);
      stats.buildings++;
      stats.byProfile[out.profile] = (stats.byProfile[out.profile] ?? 0) + 1;
      if (out.instances.length > 0) stats.withFacades++;
      for (const i of out.instances) stats.byModule[i.module] = (stats.byModule[i.module] ?? 0) + 1;
      instances.push(...out.instances);
      if (out.roof) roofs.push({ id: b.id, roof: out.roof });
    }
    stats.instances = instances.length;
    stats.pitchedRoofs = roofs.length;
    await writeNdjson(join(outDir, FACADES_FILE), instances);
    await writeNdjson(join(outDir, ROOFS_FILE), roofs);
    await writeFile(join(outDir, 'facades-report.json'), `${JSON.stringify(stats, null, 2)}\n`);
    ctx.logger.info({ buildings: stats.buildings, instances: stats.instances, pitchedRoofs: stats.pitchedRoofs }, 'facades and roofs generated');
  },
};
