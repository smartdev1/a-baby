/**
 * Role: fixed-size pool of worker threads running one job at a time each; jobs queue in order, a worker crash fails every pending job instead of hanging.
 * Owner: backend
 */

import { Worker } from 'node:worker_threads';

interface Job<I, O> {
  readonly id: number;
  readonly input: I;
  readonly resolve: (output: O) => void;
  readonly reject: (error: Error) => void;
}

type Reply<O> = { readonly id: number; readonly ok: true; readonly output: O } | { readonly id: number; readonly ok: false; readonly error: string };

export class WorkerPool<I, O> {
  private readonly workers: Worker[] = [];
  private readonly idle: Worker[] = [];
  private readonly queue: Job<I, O>[] = [];
  private readonly running = new Map<Worker, Job<I, O>>();
  private nextId = 0;
  private failure: Error | null = null;

  /** Workers load TypeScript through tsx, as the CLI does. */
  constructor(script: URL, size: number, workerData: unknown = null) {
    for (let k = 0; k < size; k++) {
      const worker = new Worker(script, { workerData, execArgv: ['--import', 'tsx'] });
      worker.on('message', (reply: Reply<O>) => this.settle(worker, reply));
      worker.on('error', (error: unknown) => this.fail(error instanceof Error ? error : new Error(String(error))));
      worker.on('exit', (code) => {
        if (code !== 0) this.fail(new Error(`worker exited with code ${code}`));
      });
      this.workers.push(worker);
      this.idle.push(worker);
    }
  }

  run(input: I): Promise<O> {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise<O>((resolve, reject) => {
      this.queue.push({ id: this.nextId++, input, resolve, reject });
      this.dispatch();
    });
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }

  private dispatch(): void {
    while (this.idle.length > 0 && this.queue.length > 0) {
      const worker = this.idle.pop();
      const job = this.queue.shift();
      if (!worker || !job) return;
      this.running.set(worker, job);
      worker.postMessage({ id: job.id, input: job.input });
    }
  }

  private settle(worker: Worker, reply: Reply<O>): void {
    const job = this.running.get(worker);
    this.running.delete(worker);
    this.idle.push(worker);
    if (job) {
      if (reply.ok) job.resolve(reply.output);
      else job.reject(new Error(reply.error));
    }
    this.dispatch();
  }

  private fail(error: Error): void {
    if (this.failure) return;
    this.failure = error;
    for (const job of [...this.running.values(), ...this.queue.splice(0)]) job.reject(error);
    this.running.clear();
  }
}
