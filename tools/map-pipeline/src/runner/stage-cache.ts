/**
 * Role: incremental cache of a stage: input hash computation, cache record read/write and up-to-date check of outputs.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { sha256OfFile, sha256OfText, stableStringify } from './content-hash.ts';
import { outputsOf, type PipelineStage, type StageContext } from './stage-contract.ts';

const CACHE_FILE = '.stage-cache.json';

const CacheRecordSchema = z.object({
  inputHash: z.string(),
  outputs: z.record(z.string(), z.string()),
});
type CacheRecord = z.infer<typeof CacheRecordSchema>;

/** Hash of everything that determines the stage output: id, version, params and input file contents. */
export const computeInputHash = async (stage: PipelineStage, ctx: StageContext): Promise<string> => {
  const files = [...stage.inputFiles(ctx)].sort();
  const fileHashes = await Promise.all(files.map(async (f) => [f, await sha256OfFile(f)] as const));
  const contentOnly = fileHashes.map(([, hash]) => hash);
  return sha256OfText(stableStringify({ id: stage.id, version: stage.version, params: stage.params(ctx), inputs: contentOnly }));
};

const readCache = async (outDir: string): Promise<CacheRecord | null> => {
  const path = join(outDir, CACHE_FILE);
  if (!existsSync(path)) return null;
  const parsed = CacheRecordSchema.safeParse(JSON.parse(await readFile(path, 'utf8')));
  return parsed.success ? parsed.data : null;
};

/** True when the cache matches the input hash and every output still has its recorded content. */
export const isUpToDate = async (stage: PipelineStage, ctx: StageContext, outDir: string, inputHash: string): Promise<boolean> => {
  const cache = await readCache(outDir);
  if (!cache || cache.inputHash !== inputHash) return false;
  for (const name of outputsOf(stage, ctx)) {
    const path = join(outDir, name);
    if (!existsSync(path) || cache.outputs[name] !== (await sha256OfFile(path))) return false;
  }
  return stage.extraOutputsPresent ? stage.extraOutputsPresent(outDir) : true;
};

export const writeCache = async (stage: PipelineStage, ctx: StageContext, outDir: string, inputHash: string): Promise<void> => {
  const outputs: Record<string, string> = {};
  for (const name of outputsOf(stage, ctx)) {
    const path = join(outDir, name);
    if (!existsSync(path)) throw new Error(`stage ${stage.id} did not write its declared output "${name}"`);
    outputs[name] = await sha256OfFile(path);
  }
  await writeFile(join(outDir, CACHE_FILE), `${JSON.stringify({ inputHash, outputs }, null, 2)}\n`);
};
