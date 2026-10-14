/**
 * Role: tests guest accounts: creation with a device token (= recovery code) and an access token, new sessions from the device token, access expiry after 15 min, file store keeping only hashes across restarts, HTTP routes.
 * Owner: backend
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify from 'fastify';
import { afterAll, describe, expect, it } from 'vitest';
import { registerAccountRoutes } from './api/account-routes.ts';
import { ACCESS_TTL_MS, AccountService } from './application/account-service.ts';
import { FileGuestAccountStore, InMemoryGuestAccountStore } from './infra/guest-account-stores.ts';

const dirs: string[] = [];

describe('guest accounts', () => {
  afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it('should create a guest and open new sessions with its device token', async () => {
    let now = 0;
    const accounts = new AccountService(new InMemoryGuestAccountStore(), () => now);
    const guest = await accounts.createGuest();
    expect(guest.deviceToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(accounts.verifyAccess(guest.accessToken)).toBe(guest.accountId);
    const again = await accounts.openSession(guest.deviceToken);
    expect(again?.accountId).toBe(guest.accountId);
    expect(await accounts.openSession('x'.repeat(43))).toBeNull();
    now = ACCESS_TTL_MS + 1;
    expect(accounts.verifyAccess(guest.accessToken)).toBeNull();
  });

  it('should keep accounts across restarts in the file store, without any token in clear', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'skyline-accounts-'));
    dirs.push(dir);
    const path = join(dir, 'guest-accounts.json');
    const guest = await new AccountService(new FileGuestAccountStore(path), () => 0).createGuest();
    const text = await readFile(path, 'utf8');
    expect(text).not.toContain(guest.deviceToken);
    expect(text).not.toContain(guest.accessToken);
    const restarted = new AccountService(new FileGuestAccountStore(path), () => 0);
    expect((await restarted.openSession(guest.deviceToken))?.accountId).toBe(guest.accountId);
  });

  it('should serve the guest routes', async () => {
    const server = Fastify();
    registerAccountRoutes(server, new AccountService(new InMemoryGuestAccountStore(), () => 0));
    const created = await server.inject({ method: 'POST', url: '/api/v1/auth/guest' });
    expect(created.statusCode).toBe(201);
    const { deviceToken, accessToken, accountId } = created.json<{ deviceToken: string; accessToken: string; accountId: string }>();
    const session = await server.inject({ method: 'POST', url: '/api/v1/auth/guest/session', payload: { deviceToken } });
    expect(session.json()).toMatchObject({ accountId, expiresInS: 900 });
    expect((await server.inject({ method: 'POST', url: '/api/v1/auth/guest/session', payload: { deviceToken: 'nope' } })).statusCode).toBe(400);
    expect((await server.inject({ method: 'GET', url: '/api/v1/me', headers: { authorization: `Bearer ${accessToken}` } })).json()).toMatchObject({ accountId, kind: 'guest' });
    expect((await server.inject({ method: 'GET', url: '/api/v1/me' })).statusCode).toBe(401);
    await server.close();
  });
});
