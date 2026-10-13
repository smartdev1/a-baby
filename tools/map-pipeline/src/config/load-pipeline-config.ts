/**
 * Role: reads a pipeline configuration file and validates it, with readable error messages.
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { type PipelineConfig, PipelineConfigSchema } from './pipeline-config-schema.ts';

export class PipelineConfigError extends Error {
  override readonly name = 'PipelineConfigError';
}

export const parsePipelineConfig = (raw: unknown, origin: string): PipelineConfig => {
  const result = PipelineConfigSchema.safeParse(raw);
  if (!result.success) throw new PipelineConfigError(`invalid pipeline config ${origin}:\n${z.prettifyError(result.error)}`);
  return result.data;
};

export const loadPipelineConfig = async (absolutePath: string): Promise<PipelineConfig> => {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    throw new PipelineConfigError(`cannot read pipeline config ${absolutePath}: ${(error as Error).message}`);
  }
  return parsePipelineConfig(raw, absolutePath);
};
