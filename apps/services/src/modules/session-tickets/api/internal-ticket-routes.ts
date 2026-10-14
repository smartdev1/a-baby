/**
 * Role: POST /internal/v1/session-tickets/consume: lets a gateway running in another process consume a ticket; loopback callers only, enabled by SERVICES_INTERNAL_ROUTES.
 * Owner: backend
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { TicketService } from '../application/ticket-service.ts';

const Body = z.object({ ticket: z.string().min(1).max(512) });
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export const registerInternalTicketRoutes = (server: FastifyInstance, tickets: TicketService): void => {
  // Not rate-limited per IP: every gateway call comes from the same loopback address.
  server.post('/internal/v1/session-tickets/consume', { config: { rateLimit: false } }, (request, reply) => {
    if (!LOOPBACK.has(request.ip)) return reply.code(403).send({ error: 'forbidden' });
    const body = Body.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid_body' });
    const check = tickets.consume(body.data.ticket);
    return reply.header('cache-control', 'no-store').send(check ? { valid: true, accountId: check.accountId } : { valid: false });
  });
};
