/**
 * Role: guest accounts (ARCHITECTURE §14.1, §20.3): a guest profile is created with a 256-bit device token that is also its recovery code; the token opens 15-minute access tokens. Only SHA-256 hashes of tokens are kept; no identity data at all.
 * Owner: backend
 */

import { createHash, randomBytes } from 'node:crypto';

export const ACCESS_TTL_MS = 15 * 60_000;
const MAX_ACCESS_TOKENS = 100_000;

export interface GuestAccount {
  readonly id: string;
  readonly deviceTokenHash: string;
  readonly createdAtMs: number;
}

/** Storage port of guest accounts (file store until the database, J6-01). */
export interface GuestAccountStore {
  byDeviceHash(hash: string): Promise<GuestAccount | null>;
  byId(id: string): Promise<GuestAccount | null>;
  save(account: GuestAccount): Promise<void>;
}

export interface AccessGrant {
  readonly accountId: string;
  readonly accessToken: string;
  readonly expiresInS: number;
}

export const tokenHash = (token: string): string => createHash('sha256').update(token).digest('base64url');
const newToken = (): string => randomBytes(32).toString('base64url');

export class AccountService {
  /** access token hash → account and expiry. */
  private readonly access = new Map<string, { accountId: string; expiresAtMs: number }>();

  constructor(
    private readonly store: GuestAccountStore,
    private readonly now: () => number,
  ) {}

  /** New guest profile: the device token is shown once to the player (and is its recovery code). */
  async createGuest(): Promise<AccessGrant & { deviceToken: string }> {
    const deviceToken = newToken();
    const account: GuestAccount = { id: `acc_${randomBytes(12).toString('base64url')}`, deviceTokenHash: tokenHash(deviceToken), createdAtMs: this.now() };
    await this.store.save(account);
    return { ...this.grant(account.id), deviceToken };
  }

  /** Device token (or recovery code typed on another browser) → access token; null when unknown. */
  async openSession(deviceToken: string): Promise<AccessGrant | null> {
    const account = await this.store.byDeviceHash(tokenHash(deviceToken));
    return account ? this.grant(account.id) : null;
  }

  /** Account of a valid access token, or null. */
  verifyAccess(accessToken: string): string | null {
    const entry = this.access.get(tokenHash(accessToken));
    if (!entry || entry.expiresAtMs < this.now()) return null;
    return entry.accountId;
  }

  account(id: string): Promise<GuestAccount | null> {
    return this.store.byId(id);
  }

  private grant(accountId: string): AccessGrant {
    this.purge();
    const accessToken = newToken();
    this.access.set(tokenHash(accessToken), { accountId, expiresAtMs: this.now() + ACCESS_TTL_MS });
    return { accountId, accessToken, expiresInS: ACCESS_TTL_MS / 1000 };
  }

  private purge(): void {
    if (this.access.size < MAX_ACCESS_TOKENS) return;
    const now = this.now();
    for (const [hash, entry] of this.access) if (entry.expiresAtMs < now) this.access.delete(hash);
    if (this.access.size >= MAX_ACCESS_TOKENS) throw new Error('too many access tokens');
  }
}
