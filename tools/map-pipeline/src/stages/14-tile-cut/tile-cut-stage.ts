/**
 * Role: stage 14-tile-cut: cuts buildings (with pitched roofs), roads, places, props and facades into 250 m L0 tiles (tiles.ndjson, one tile per line, local metres).
 * Owner: backend
 */

import { join } from 'node:path';
import type { BuildingRecord, ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { TileCutter } from '../../tiling/tile-cutter.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';
import { BUILDINGS_FILE, HEIGHTS_STAGE_ID } from '../06-heights/heights-stage.ts';
import { NAMING_STAGE_ID, PLACE_NAMES_FILE } from '../09-naming/naming-stage.ts';
import { TERRAIN_FILE, TERRAIN_STAGE_ID } from '../10-terrain/terrain-stage.ts';
import type { TileTerrain } from '../../terrain/tile-terrain.ts';
import type { PlacedInstance } from '../../props/placed-instance.ts';
import { type BuildingRoof, FACADES_FILE, FACADES_STAGE_ID, ROOFS_FILE } from '../11-facades-roofs/facades-roofs-stage.ts';
import { PROPS_FILE, PROPS_STAGE_ID } from '../12-props/props-stage.ts';
import type { PlaceSites } from '../../places/site-placement.ts';
import { PLACES_SITES_FILE, PLACES_STAGE_ID } from '../13-places-sites/places-sites-stage.ts';
import type { PlaceName } from '../../naming/name-place.ts';

export const TILE_CUT_STAGE_ID = '14-tile-cut';
export const TILES_FILE = 'tiles.ndjson';

export const tileCutStage: PipelineStage = {
  id: TILE_CUT_STAGE_ID,
  // v5: facade instances and pitched roofs (11-facades-roofs). v6: place types and action sites (13-places-sites).
  version: 6,
  outputs: [TILES_FILE],
  inputFiles: (ctx) => [ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE), ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE), ctx.outputOf(NAMING_STAGE_ID, PLACE_NAMES_FILE), ctx.outputOf(TERRAIN_STAGE_ID, TERRAIN_FILE), ctx.outputOf(PROPS_STAGE_ID, PROPS_FILE), ctx.outputOf(FACADES_STAGE_ID, FACADES_FILE), ctx.outputOf(FACADES_STAGE_ID, ROOFS_FILE), ctx.outputOf(PLACES_STAGE_ID, PLACES_SITES_FILE)],
  params: () => ({ tileSizeM: 250 }),
  run: async (ctx, outDir) => {
    const names = new Map<string, string | null>();
    for await (const n of readNdjson<PlaceName>(ctx.outputOf(NAMING_STAGE_ID, PLACE_NAMES_FILE))) names.set(n.id, n.displayName);
    const terrain = new Map<string, TileTerrain>();
    for await (const t of readNdjson<TileTerrain>(ctx.outputOf(TERRAIN_STAGE_ID, TERRAIN_FILE))) terrain.set(t.key, t);
    const sites = new Map<string, PlaceSites>();
    for await (const p of readNdjson<PlaceSites>(ctx.outputOf(PLACES_STAGE_ID, PLACES_SITES_FILE))) sites.set(p.id, p);
    const cutter = new TileCutter(names, terrain, sites);
    const roofs = new Map<string, BuildingRoof['roof']>();
    for await (const r of readNdjson<BuildingRoof>(ctx.outputOf(FACADES_STAGE_ID, ROOFS_FILE))) roofs.set(r.id, r.roof);
    for await (const b of readNdjson<BuildingRecord>(ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE))) cutter.addBuilding(b, roofs.get(b.id));
    for await (const r of readNdjson<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE))) cutter.addClassified(r);
    for await (const p of readNdjson<PlacedInstance>(ctx.outputOf(PROPS_STAGE_ID, PROPS_FILE))) cutter.addInstance(p);
    for await (const p of readNdjson<PlacedInstance>(ctx.outputOf(FACADES_STAGE_ID, FACADES_FILE))) cutter.addInstance(p);
    const count = await writeNdjson(join(outDir, TILES_FILE), cutter.sortedTiles());
    ctx.logger.info({ tiles: count }, 'tiles cut');
  },
};
