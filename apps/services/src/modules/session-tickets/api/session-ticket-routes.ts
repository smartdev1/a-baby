/**
 * Role: POST /api/v1/session-tickets: gives a guest client a single-use ticket to open the gateway WebSocket (strict per-IP rate limit). Guest profiles arrive in J6.
 * Owner: backend
 */

import type { FastifyInstance } from 'fastify';
import type { TicketService } from '../application/ticket-service.ts';

export const registerSessionTicketRoutes = (server: FastifyInstance, tickets: TicketService, perMinute = 10): void => {
  server.post(
    '/api/v1/session-tickets',
    { config: { rateLimit: { max: perMinute, timeWindow: '1 minute' } } },
    (_request, reply) => reply.header('cache-control', 'no-store').code(201).send(tickets.issue()),
  );
};
