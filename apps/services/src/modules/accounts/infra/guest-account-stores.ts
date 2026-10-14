/**
 * Role: GuestAccountStore adapters: in memory (tests) and a JSON file under data/runtime (survives restarts until the database, J6-01); only ids, token hashes and creation times are stored.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import type { GuestAccount, GuestAccountStore } from '../application/account-service.ts';

const AccountsSchema = z.array(z.object({ id: z.string(), deviceTokenHash: z.string(), createdAtMs: z.number() }).strict());

export class InMemoryGuestAccountStore implements GuestAccountStore {
  protected readonly byHash = new Map<string, GuestAccount>();
  protected readonly ids = new Map<string, GuestAccount>();

  byDeviceHash(hash: string): Promise<GuestAccount | null> {
    return Promise.resolve(this.byHash.get(hash) ?? null);
  }

  byId(id: string): Promise<GuestAccount | null> {
    return Promise.resolve(this.ids.get(id) ?? null);
  }

  save(account: GuestAccount): Promise<void> {
    this.byHash.set(account.deviceTokenHash, account);
    this.ids.set(account.id, account);
    return Promise.resolve();
  }
}

export class FileGuestAccountStore extends InMemoryGuestAccountStore {
  private loaded = false;
  private writing: Promise<void> = Promise.resolve();

  constructor(private readonly path: string) {
    super();
  }

  override async byDeviceHash(hash: string): Promise<GuestAccount | null> {
    await this.load();
    return super.byDeviceHash(hash);
  }

  override async byId(id: string): Promise<GuestAccount | null> {
    await this.load();
    return super.byId(id);
  }

  /** Atomic write (temp file + rename), serialised so concurrent creations never lose an account. */
  override async save(account: GuestAccount): Promise<void> {
    await this.load();
    await super.save(account);
    this.writing = this.writing.then(async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const tmp = `${this.path}.tmp`;
      await writeFile(tmp, `${JSON.stringify([...this.ids.values()])}\n`);
      await rename(tmp, this.path);
    });
    await this.writing;
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    if (!existsSync(this.path)) return;
    for (const a of AccountsSchema.parse(JSON.parse(await readFile(this.path, 'utf8')))) await super.save(a);
  }
}
