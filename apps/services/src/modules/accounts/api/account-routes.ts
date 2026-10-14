/**
 * Role: guest account routes (ARCHITECTURE §14.1): POST /api/v1/auth/guest (new profile, strict per-IP limit against profile farms), POST /api/v1/auth/guest/session (device token or recovery code → access token, limited), GET /api/v1/me (Bearer access token).
 * Owner: backend
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { AccountService } from '../application/account-service.ts';

const SessionBody = z.object({ deviceToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();

/** Account of the request's `Authorization: Bearer <access token>`, or null. */
export const bearerAccount = (accounts: AccountService, request: FastifyRequest): string | null => {
  const header = request.headers.authorization;
  const match = header ? /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header) : null;
  return match?.[1] ? accounts.verifyAccess(match[1]) : null;
};

export const registerAccountRoutes = (server: FastifyInstance, accounts: AccountService): void => {
  server.post('/api/v1/auth/guest', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (_request, reply) =>
    reply.header('cache-control', 'no-store').code(201).send(await accounts.createGuest()),
  );
  server.post('/api/v1/auth/guest/session', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = SessionBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid_body' });
    const grant = await accounts.openSession(body.data.deviceToken);
    if (!grant) return reply.code(401).send({ error: 'unknown_device_token' });
    return reply.header('cache-control', 'no-store').send(grant);
  });
  server.get('/api/v1/me', async (request, reply) => {
    const accountId = bearerAccount(accounts, request);
    const account = accountId ? await accounts.account(accountId) : null;
    if (!account) return reply.code(401).send({ error: 'unauthorized' });
    return reply.header('cache-control', 'no-store').send({ accountId: account.id, kind: 'guest', createdAtMs: account.createdAtMs });
  });
};
