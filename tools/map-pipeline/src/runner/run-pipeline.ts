/**
 * Role: runs an ordered list of stages, skipping each one whose cached output matches its input hash (incremental build).
 * Owner: backend
 */

import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Logger } from '@skyline/observability';
import type { PipelineConfig } from '../config/pipeline-config-schema.ts';
import { computeInputHash, isUpToDate, writeCache } from './stage-cache.ts';
import type { PipelineStage, StageContext, StageReport } from './stage-contract.ts';

export interface RunPipelineOptions {
  readonly repoRoot: string;
  readonly config: PipelineConfig;
  readonly stages: readonly PipelineStage[];
  readonly logger: Logger;
  /** Re-run every stage even when its cache is valid. */
  readonly force?: boolean;
}

const stagesRoot = (repoRoot: string, config: PipelineConfig): string => resolve(repoRoot, config.outputDir, 'stages');

export const createStageContext = (repoRoot: string, config: PipelineConfig, logger: Logger): StageContext => ({
  repoRoot,
  config,
  logger,
  outputOf: (stageId, fileName) => join(stagesRoot(repoRoot, config), stageId, fileName),
  fromRepo: (relativePath) => resolve(repoRoot, relativePath),
});

export const runPipeline = async ({ repoRoot, config, stages, logger, force = false }: RunPipelineOptions): Promise<StageReport[]> => {
  const ctx = createStageContext(repoRoot, config, logger);
  const reports: StageReport[] = [];

  for (const stage of stages) {
    const startedAt = performance.now();
    const outDir = join(stagesRoot(repoRoot, config), stage.id);
    await mkdir(outDir, { recursive: true });
    const inputHash = await computeInputHash(stage, ctx);

    if (!force && (await isUpToDate(stage, ctx, outDir, inputHash))) {
      reports.push({ id: stage.id, status: 'cached', durationMs: performance.now() - startedAt });
      logger.info({ stage: stage.id }, 'stage up to date, skipped');
      continue;
    }

    logger.info({ stage: stage.id }, 'stage running');
    await stage.run(ctx, outDir);
    // Recomputed after the run: a stage may create one of its own inputs (01-acquire downloads the snapshot it declares).
    await writeCache(stage, ctx, outDir, await computeInputHash(stage, ctx));
    reports.push({ id: stage.id, status: 'ran', durationMs: performance.now() - startedAt });
  }
  return reports;
};
