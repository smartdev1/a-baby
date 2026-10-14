/**
 * Role: worker thread entry of the tile encoding pool: receives encoding jobs, runs them and posts the encoded files back.
 * Owner: backend
 */

import { parentPort, workerData } from 'node:worker_threads';
import { type EncodeContext, type EncodeJob, runEncodeJob } from './encode-jobs.ts';

const data = workerData as EncodeContext;
const context = { existing: new Set(data.existing), options: data.options, outDir: data.outDir };

parentPort?.on('message', (message: { id: number; input: EncodeJob }) => {
  runEncodeJob(message.input, context).then(
    (output) => parentPort?.postMessage({ id: message.id, ok: true, output }),
    (error: unknown) => parentPort?.postMessage({ id: message.id, ok: false, error: error instanceof Error ? (error.stack ?? error.message) : String(error) }),
  );
});
