/**
 * Role: contract every pipeline stage implements (declared inputs, parameters, outputs, run) and the context it receives.
 * Owner: backend
 */

import type { Logger } from '@skyline/observability';
import type { PipelineConfig } from '../config/pipeline-config-schema.ts';

export interface StageContext {
  /** Absolute path of the repository root; config paths are relative to it. */
  readonly repoRoot: string;
  readonly config: PipelineConfig;
  readonly logger: Logger;
  /** Absolute path of a file produced by an earlier stage. */
  outputOf(stageId: string, fileName: string): string;
  /** Absolute path of a repository-relative path. */
  fromRepo(relativePath: string): string;
}

export interface PipelineStage {
  /** `<nn>-<name>`, e.g. `01-source`. Also the name of its output folder. */
  readonly id: string;
  /** Bump when the stage code changes its output, to invalidate caches. */
  readonly version: number;
  /** File names the stage writes into its output folder (a function when they depend on the config). */
  readonly outputs: readonly string[] | ((ctx: StageContext) => readonly string[]);
  /** Absolute paths of every file the stage reads. */
  inputFiles(ctx: StageContext): string[];
  /** JSON-serializable configuration slice that influences the output. */
  params(ctx: StageContext): unknown;
  /** Writes every declared output into `outDir`. */
  run(ctx: StageContext, outDir: string): Promise<void>;
  /** Optional extra check of undeclared outputs (e.g. thousands of tile files listed in an index). */
  extraOutputsPresent?(outDir: string): Promise<boolean>;
}

export const outputsOf = (stage: PipelineStage, ctx: StageContext): readonly string[] =>
  typeof stage.outputs === 'function' ? stage.outputs(ctx) : stage.outputs;

export type StageStatus = 'ran' | 'cached';

export interface StageReport {
  readonly id: string;
  readonly status: StageStatus;
  readonly durationMs: number;
}
