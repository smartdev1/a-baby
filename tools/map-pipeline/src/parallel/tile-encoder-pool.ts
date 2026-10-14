/**
 * Role: encodes tiles on a worker pool (SKYLINE_PIPELINE_WORKERS, default: available cores − 1) or inline when it is 0; callers get the same results either way.
 * Owner: backend
 */

import { availableParallelism } from 'node:os';
import { type EncodeContext, type EncodeJob, type EncodeJobResult, runEncodeJob } from './encode-jobs.ts';
import { WorkerPool } from './worker-pool.ts';

export interface TileEncoderPool {
  readonly size: number;
  encode(job: EncodeJob): Promise<EncodeJobResult>;
  close(): Promise<void>;
}

/** 0 = inline (no worker thread). */
export const pipelineWorkerCount = (env: Record<string, string | undefined> = process.env): number => {
  const raw = env['SKYLINE_PIPELINE_WORKERS'];
  if (raw !== undefined && raw !== '') {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) throw new Error(`SKYLINE_PIPELINE_WORKERS must be a non-negative integer, got "${raw}"`);
    return n;
  }
  return Math.max(1, availableParallelism() - 1);
};

export const createTileEncoderPool = (context: EncodeContext, workers = pipelineWorkerCount()): TileEncoderPool => {
  if (workers === 0) {
    const inline = { existing: new Set(context.existing), options: context.options, outDir: context.outDir };
    return { size: 0, encode: (job) => runEncodeJob(job, inline), close: () => Promise.resolve() };
  }
  const pool = new WorkerPool<EncodeJob, EncodeJobResult>(new URL('./encode-worker.ts', import.meta.url), workers, context);
  return { size: workers, encode: (job) => pool.run(job), close: () => pool.close() };
};

/**
 * Jobs in flight: results are tiny (files are written by the workers), so a wide window keeps every worker busy
 * behind a slow dense tile at the head of the ordered queue; the bound only limits the tile lines held in memory.
 */
export const inFlightFor = (pool: Pick<TileEncoderPool, 'size'>): number => Math.max(4, pool.size * 16);
