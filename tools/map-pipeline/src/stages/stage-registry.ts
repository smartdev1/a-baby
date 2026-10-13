/**
 * Role: ordered list of the pipeline stages for a config. Adding a stage = one new folder under stages/ + one line here.
 * Owner: backend
 */

import type { PipelineConfig } from '../config/pipeline-config-schema.ts';
import type { PipelineStage } from '../runner/stage-contract.ts';
import { createAcquireStage } from './01-acquire/acquire-stage.ts';
import { sourceStage } from './01-source/source-stage.ts';
import { createExtractStage } from './02-extract/extract-stage.ts';
import { createExportStage } from './03-export/export-stage.ts';
import { normalizeStage } from './04-normalize/normalize-stage.ts';
import { classifyStage } from './05-classify/classify-stage.ts';
import { heightsStage } from './06-heights/heights-stage.ts';
import { createReportStage } from './18-report/report-stage.ts';

/** Stages shared by every source, after 03-export. */
const COMMON_STAGES: PipelineStage[] = [normalizeStage, classifyStage, heightsStage, createReportStage()];

/** Execution order (ARCHITECTURE §11.2). Both source kinds end with 03-export → features.geojsonseq. */
export const stagesFor = (config: PipelineConfig): PipelineStage[] =>
  config.source.kind === 'osm-snapshot'
    ? [createAcquireStage(), createExtractStage(), createExportStage(), ...COMMON_STAGES]
    : [sourceStage, createExportStage(), ...COMMON_STAGES];
