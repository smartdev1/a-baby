/**
 * Role: stage 08b-transit: public transport lines of the commune (SOTRA bus, gbaka, woro-woro) from the OSM route relations, with stops and a path on the road graph (transit-lines.ndjson) and a report of the lines kept and rejected.
 * Owner: backend
 */

import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseOplLine } from '../../osm/opl-format.ts';
import { OSMIUM_IMAGE, transitRelationsArgs } from '../../osmium/osmium-commands.ts';
import { ensureOsmiumImage, type RunOsmium, runOsmium } from '../../osmium/run-osmium.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { RoadEdge } from '../../roads/road-graph-types.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { buildTransitLines, type TransitLine } from '../../transit/transit-lines.ts';
import { COMMUNE_PBF_FILE, EXTRACT_STAGE_ID } from '../02-extract/extract-stage.ts';
import { ROADS_STAGE_ID } from '../08-roads/roads-stage.ts';

export const TRANSIT_STAGE_ID = '08b-transit';
export const TRANSIT_LINES_FILE = 'transit-lines.ndjson';

const isSnapshot = (ctx: StageContext): boolean => ctx.config.source.kind === 'osm-snapshot';

const edgesByWay = async (path: string): Promise<Map<string, RoadEdge[]>> => {
  const out = new Map<string, RoadEdge[]>();
  for await (const e of readNdjson<RoadEdge>(path)) {
    const list = out.get(e.wayId);
    if (list) list.push(e);
    else out.set(e.wayId, [e]);
  }
  return out;
};

const countBy = <T>(items: readonly T[], key: (t: T) => string): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const i of items) out[key(i)] = (out[key(i)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
};

export const createTransitStage = (osmium: RunOsmium = runOsmium, checkImage = ensureOsmiumImage): PipelineStage => ({
  id: TRANSIT_STAGE_ID,
  // Bump when transit/*.ts change their output.
  version: 1,
  outputs: [TRANSIT_LINES_FILE, 'transit-report.json'],
  inputFiles: (ctx) => [ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'), ...(isSnapshot(ctx) ? [ctx.outputOf(EXTRACT_STAGE_ID, COMMUNE_PBF_FILE)] : [])],
  params: (ctx) => ({ image: isSnapshot(ctx) ? OSMIUM_IMAGE : null }),
  run: async (ctx, outDir) => {
    let lines: TransitLine[] = [];
    let rejected: { id: string; reason: string }[] = [];
    if (isSnapshot(ctx)) {
      await checkImage();
      const opl = join(outDir, 'transit.opl');
      await osmium(transitRelationsArgs(`/in/${COMMUNE_PBF_FILE}`, '/out/transit.opl'), { inputDir: join(ctx.outputOf(EXTRACT_STAGE_ID, COMMUNE_PBF_FILE), '..'), outputDir: outDir });
      const objects = (await readFile(opl, 'utf8')).split('\n').flatMap((l) => parseOplLine(l) ?? []);
      await rm(opl, { force: true });
      ({ lines, rejected } = buildTransitLines(objects, await edgesByWay(ctx.outputOf(ROADS_STAGE_ID, 'road-edges.ndjson'))));
    }
    await writeNdjson(join(outDir, TRANSIT_LINES_FILE), lines);
    const report = {
      lines: lines.length,
      byMode: countBy(lines, (l) => l.mode),
      stops: new Set(lines.flatMap((l) => l.stops.map((s) => s.id))).size,
      totalKm: Math.round(lines.reduce((s, l) => s + l.lengthM, 0) / 1000),
      rejected: rejected.length,
      rejectedByReason: countBy(rejected, (r) => r.reason),
    };
    await writeFile(join(outDir, 'transit-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    ctx.logger.info(report, 'transit lines built');
  },
});
