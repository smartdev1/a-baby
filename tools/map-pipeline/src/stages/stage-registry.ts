/**
 * Role: ordered list of the pipeline stages. Adding a stage = one new folder under stages/ + one line here.
 * Owner: backend
 */

import type { PipelineStage } from '../runner/stage-contract.ts';
import { sourceStage } from './01-source/source-stage.ts';

/** Execution order (ARCHITECTURE §11.2). Business stages arrive with T-011, T-012 and T-022. */
export const PIPELINE_STAGES: readonly PipelineStage[] = [sourceStage];
