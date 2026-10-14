/**
 * Role: stage 13-places-sites: gives each OSM place its game place type (content/place-types) and positions its action sites (places-sites.ndjson), with a report of the places per type and the categories without type.
 * Owner: backend
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rngFor } from '../../determinism/seeded-rng.ts';
import { PLACE_TYPES_DIR, PlaceTypeCatalogue, placeTypeFiles } from '../../places/place-type-catalogue.ts';
import { type PlaceSites, placeSites } from '../../places/site-placement.ts';
import { PlacementGuards } from '../../props/placement-guards.ts';
import type { BuildingRecord, ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { RoadEdge } from '../../roads/road-graph-types.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { representativePoint } from '../../tiling/tile-cutter.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';
import { BUILDINGS_FILE, HEIGHTS_STAGE_ID } from '../06-heights/heights-stage.ts';
import { ROADS_STAGE_ID } from '../08-roads/roads-stage.ts';

export const PLACES_STAGE_ID = '13-places-sites';
export const PLACES_SITES_FILE = 'places-sites.ndjson';

const collect = async <T>(path: string, keep: (v: T) => boolean = () => true): Promise<T[]> => {
  const out: T[] = [];
  for await (const v of readNdjson<T>(path)) if (keep(v)) out.push(v);
  return out;
};

const count = (counts: Record<string, number>, key: string): void => {
  counts[key] = (counts[key] ?? 0) + 1;
};

export const placesSitesStage: PipelineStage = {
  id: PLACES_STAGE_ID,
  // Bump when places/*.ts change their output.
  version: 1,
  outputs: [PLACES_SITES_FILE, 'places-report.json'],
  inputFiles: (ctx) => [
    ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE),
    ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE),
    ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'),
    ...placeTypeFiles(ctx.fromRepo(PLACE_TYPES_DIR)),
  ],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    const catalogue = PlaceTypeCatalogue.load(ctx.fromRepo(PLACE_TYPES_DIR));
    const buildings = await collect<BuildingRecord>(ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE));
    const roads = await collect<RoadEdge>(ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'), (e) => e.cars);
    const guards = new PlacementGuards(buildings, roads);
    const byType: Record<string, number> = {};
    const untyped: Record<string, number> = {};
    const places: PlaceSites[] = [];
    for await (const r of readNdjson<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE))) {
      if (!r.placeCategory) continue;
      const type = catalogue.typeOf(r.placeCategory);
      if (!type) {
        count(untyped, r.placeCategory);
        continue;
      }
      count(byType, type.id);
      const footprint = r.isBuilding && r.geometry.type === 'MultiPolygon' ? (r.geometry.coordinates[0]?.[0] ?? null) : null;
      const sites = placeSites({ point: representativePoint(r.geometry), type, footprint }, guards, rngFor(ctx.config.seed, `sites:${r.id}`));
      places.push({ id: r.id, placeType: type.id, sites });
    }
    await writeNdjson(join(outDir, PLACES_SITES_FILE), places);
    const sort = (c: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(c).sort(([a, x], [b, y]) => y - x || (a < b ? -1 : 1)));
    const report = { typedPlaces: places.length, placeTypes: catalogue.types.length, byPlaceType: sort(byType), categoriesWithoutType: sort(untyped) };
    await writeFile(join(outDir, 'places-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    ctx.logger.info({ typedPlaces: places.length, untypedCategories: Object.keys(untyped).length }, 'places typed and sites placed');
  },
};
