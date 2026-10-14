/**
 * Role: POST /api/v1/session-tickets: gives a client a single-use ticket to open the gateway WebSocket, bound to its guest account (Bearer access token); without one, refused unless anonymous tickets are allowed (local dev only). Strict per-IP rate limit.
 * Owner: backend
 */

import type { FastifyInstance } from 'fastify';
import { bearerAccount } from '../../accounts/api/account-routes.ts';
import type { AccountService } from '../../accounts/application/account-service.ts';
import type { TicketService } from '../application/ticket-service.ts';

export interface TicketRouteOptions {
  readonly accounts: AccountService;
  readonly perMinute?: number;
  /** Local dev and load tests: a ticket without an account (the player is a throw-away character). */
  readonly anonymous?: boolean;
}

export const registerSessionTicketRoutes = (server: FastifyInstance, tickets: TicketService, options: TicketRouteOptions): void => {
  server.post('/api/v1/session-tickets', { config: { rateLimit: { max: options.perMinute ?? 10, timeWindow: '1 minute' } } }, (request, reply) => {
    const accountId = bearerAccount(options.accounts, request);
    if (accountId === null && !options.anonymous) return reply.code(401).send({ error: 'unauthorized' });
    return reply.header('cache-control', 'no-store').code(201).send(tickets.issue(accountId));
  });
};
