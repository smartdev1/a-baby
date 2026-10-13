/**
 * Role: stage 09-naming: the only producer of displayed place names (ADR 0010) — real toponyms, parodied brands, deformed shop names, overrides; fails on an unknown brand.
 * Owner: backend
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadNamingRules, namingContentFiles } from '../../naming/naming-content.ts';
import { namePlace, type PlaceName } from '../../naming/name-place.ts';
import type { ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';

export const NAMING_STAGE_ID = '09-naming';
export const PLACE_NAMES_FILE = 'place-names.ndjson';
const CONTENT_DIR = 'content/place-names';

const contentDir = (ctx: StageContext): string => ctx.fromRepo(CONTENT_DIR);

export const namingStage: PipelineStage = {
  id: NAMING_STAGE_ID,
  version: 1,
  outputs: [PLACE_NAMES_FILE, 'naming-report.json'],
  inputFiles: (ctx) => [ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE), ...namingContentFiles(contentDir(ctx))],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    const rules = await loadNamingRules(contentDir(ctx), ctx.config.seed);
    const names: PlaceName[] = [];
    const unknown = new Map<string, number>();
    for await (const r of readNdjson<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE))) {
      if (!r.placeCategory) continue;
      for (const brand of rules.brands.unknownBrands(r.tags['brand'])) unknown.set(brand, (unknown.get(brand) ?? 0) + 1);
      names.push(namePlace(r, rules));
    }
    if (unknown.size > 0) {
      const list = [...unknown].map(([b, n]) => `  "${b}" (${n})`).join('\n');
      throw new Error(`unknown brands: add a parody to ${CONTENT_DIR}/brand-parodies.json (human review), then rebuild:\n${list}`);
    }
    const bySource: Record<string, number> = {};
    for (const n of names) bySource[n.source] = (bySource[n.source] ?? 0) + 1;
    await writeNdjson(join(outDir, PLACE_NAMES_FILE), names);
    await writeFile(join(outDir, 'naming-report.json'), `${JSON.stringify({ places: names.length, bySource }, null, 2)}\n`);
    ctx.logger.info({ places: names.length, bySource }, 'place names decided');
  },
};
