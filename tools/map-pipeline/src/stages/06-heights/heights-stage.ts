/**
 * Role: stage 06-heights: keeps building records and gives each one levels, height in metres and the source of that height (buildings.ndjson); generic buildings without OSM height use the profile of their neighbourhood (heights-report.json lists the mapping for owner review).
 * Owner: backend
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadNeighbourhoodProfiles, type NeighbourhoodProfiles, profileNameOf } from '../../config/neighbourhood-profiles.ts';
import { rngFor } from '../../determinism/seeded-rng.ts';
import { multiPolygonAreaM2 } from '../../geometry/utm-polygon-area.ts';
import { type HeightProfile, resolveHeight } from '../../heuristics/height-heuristics.ts';
import { NeighbourhoodIndex } from '../../heuristics/neighbourhood-index.ts';
import type { BuildingRecord, ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { representativePoint } from '../../tiling/tile-cutter.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';

export const HEIGHTS_STAGE_ID = '06-heights';
export const BUILDINGS_FILE = 'buildings.ndjson';
export const HEIGHTS_REPORT_FILE = 'heights-report.json';

/** Resolves the height profile of a building position, counting what it does for the report. */
class ProfileLookup {
  readonly byProfile: Record<string, number> = {};
  readonly byNeighbourhood: Record<string, number> = {};
  readonly unmapped: Record<string, number> = {};
  /** Name → profile name, resolved once per neighbourhood. */
  private readonly resolved = new Map<string, string | null>();

  constructor(
    private readonly config: NeighbourhoodProfiles | null,
    private readonly index: NeighbourhoodIndex,
  ) {}

  at(e: number, n: number, footprintAreaM2: number): HeightProfile | undefined {
    if (!this.config || footprintAreaM2 < this.config.minFootprintM2) return undefined;
    const name = this.index.nameAt(e, n, this.config.maxPointDistanceM);
    if (!name) return undefined;
    this.byNeighbourhood[name] = (this.byNeighbourhood[name] ?? 0) + 1;
    const profileName = this.profileNameOf(this.config, name);
    const profile = profileName ? this.config.profiles[profileName] : undefined;
    if (!profileName || !profile) {
      this.unmapped[name] = (this.unmapped[name] ?? 0) + 1;
      return undefined;
    }
    this.byProfile[profileName] = (this.byProfile[profileName] ?? 0) + 1;
    return profile.heightM ? { heightM: profile.heightM } : { levels: profile.levels ?? [[1, 1]] };
  }

  private profileNameOf(config: NeighbourhoodProfiles, name: string): string | null {
    if (!this.resolved.has(name)) this.resolved.set(name, profileNameOf(config, name));
    return this.resolved.get(name) ?? null;
  }
}

const toBuilding = (record: ClassifiedRecord, seed: string, profiles: ProfileLookup): BuildingRecord | null => {
  if (!record.isBuilding || record.geometry.type !== 'MultiPolygon') return null;
  const footprintAreaM2 = Math.round(multiPolygonAreaM2(record.geometry.coordinates) * 100) / 100;
  const type = record.tags['building'] ?? 'yes';
  const [e, n] = representativePoint(record.geometry);
  const profile = record.levels === undefined && record.heightM === undefined ? profiles.at(e, n, footprintAreaM2) : undefined;
  const height = resolveHeight(
    {
      type,
      footprintAreaM2,
      ...(record.levels === undefined ? {} : { osmLevels: record.levels }),
      ...(record.heightM === undefined ? {} : { osmHeightM: record.heightM }),
      ...(profile ? { profile } : {}),
    },
    rngFor(seed, record.id),
  );
  return { id: record.id, type, ...height, footprintAreaM2, footprint: record.geometry, placeCategory: record.placeCategory };
};

async function* buildingsOf(path: string, seed: string, profiles: ProfileLookup): AsyncGenerator<BuildingRecord> {
  for await (const record of readNdjson<ClassifiedRecord>(path)) {
    const building = toBuilding(record, seed, profiles);
    if (building) yield building;
  }
}

const sortedCounts = (counts: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(counts).sort(([a, x], [b, y]) => y - x || (a < b ? -1 : 1)));

export const heightsStage: PipelineStage = {
  id: HEIGHTS_STAGE_ID,
  // Bump when height-heuristics.ts changes its output. v2: neighbourhood profiles (T-205).
  version: 2,
  outputs: [BUILDINGS_FILE, HEIGHTS_REPORT_FILE],
  inputFiles: (ctx) => [ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE), ...(ctx.config.neighbourhoodProfiles ? [ctx.fromRepo(ctx.config.neighbourhoodProfiles)] : [])],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    const classified = ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE);
    const config = ctx.config.neighbourhoodProfiles ? await loadNeighbourhoodProfiles(ctx.fromRepo(ctx.config.neighbourhoodProfiles)) : null;
    const index = new NeighbourhoodIndex();
    if (config) for await (const record of readNdjson<ClassifiedRecord>(classified)) index.add(record);
    const profiles = new ProfileLookup(config, index.finish());
    const count = await writeNdjson(join(outDir, BUILDINGS_FILE), buildingsOf(classified, ctx.config.seed, profiles));
    const report = {
      reviewedBy: config?.reviewedBy ?? null,
      neighbourhoodsInOsm: index.size,
      buildingsByProfile: sortedCounts(profiles.byProfile),
      buildingsByNeighbourhood: sortedCounts(profiles.byNeighbourhood),
      unmappedNeighbourhoods: sortedCounts(profiles.unmapped),
    };
    await writeFile(join(outDir, HEIGHTS_REPORT_FILE), `${JSON.stringify(report, null, 2)}\n`);
    ctx.logger.info({ count, byProfile: report.buildingsByProfile, unmapped: Object.keys(report.unmappedNeighbourhoods).length }, 'building heights resolved');
  },
};
