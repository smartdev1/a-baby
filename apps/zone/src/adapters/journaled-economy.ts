/**
 * Role: EconomyPort that survives restarts until the PostgreSQL ledger (J6-05): the in-memory ledger plus an append-only NDJSON journal of successful commits (`data/runtime/ledger.ndjson`), each appended before its result is returned (money is written before it is shown), replayed at start-up; a truncated last line is skipped.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { EconomyCommitRequest, EconomyCommitResult, EconomyPort, LedgerAccountRef, LedgerSummary } from '@skyline/economy-rules';
import { z } from 'zod';
import { InMemoryEconomy } from './in-memory-economy.ts';

const EntrySchema = z.object({
  key: z.string(),
  kind: z.string(),
  legs: z.array(z.object({ account: z.string(), amount: z.string().regex(/^-?\d+$/) })),
  requestId: z.string(),
});

export class JournaledEconomy implements EconomyPort {
  private writing: Promise<void> = Promise.resolve();

  private constructor(
    private readonly ledger: InMemoryEconomy,
    private readonly path: string,
  ) {}

  /** Replays the journal into a fresh ledger. */
  static async open(path: string, onSkipped: (line: number) => void = () => undefined): Promise<JournaledEconomy> {
    const ledger = new InMemoryEconomy();
    const text = existsSync(path) ? await readFile(path, 'utf8') : '';
    // A crash mid-append leaves an unterminated line: close it so the next entry starts on its own line.
    if (text !== '' && !text.endsWith('\n')) await appendFile(path, '\n');
    const lines = text.split('\n');
    for (const [k, line] of lines.entries()) {
      if (line.trim() === '') continue;
      const parsed = EntrySchema.safeParse(JSON.parse(line.endsWith('}') ? line : '{}'));
      if (!parsed.success) {
        onSkipped(k + 1);
        continue;
      }
      const e = parsed.data;
      await ledger.commit({ idempotencyKey: e.key, kind: e.kind as EconomyCommitRequest['kind'], legs: e.legs.map((l) => ({ account: l.account, amount: BigInt(l.amount) })), reason: { requestId: e.requestId } });
    }
    await mkdir(dirname(path), { recursive: true });
    return new JournaledEconomy(ledger, path);
  }

  async commit(request: EconomyCommitRequest): Promise<EconomyCommitResult> {
    const result = await this.ledger.commit(request);
    if (!result.ok || result.replayed) return result;
    const line = JSON.stringify({ key: request.idempotencyKey, kind: request.kind, legs: request.legs.map((l) => ({ account: l.account, amount: l.amount.toString() })), requestId: request.reason.requestId });
    // Appends in commit order, one at a time.
    this.writing = this.writing.then(() => appendFile(this.path, `${line}\n`));
    await this.writing;
    return result;
  }

  balanceOf(account: LedgerAccountRef): Promise<bigint> {
    return this.ledger.balanceOf(account);
  }

  summary(): LedgerSummary & { commits: number } {
    return this.ledger.summary();
  }

  totalBalance(): bigint {
    return this.ledger.totalBalance();
  }
}
