/**
 * Role: HTTP route GET /api/v1/world-clock: current clock segment (same shape as the protocol world_clock message) plus the server time for client sync.
 * Owner: backend
 */

import type { FastifyInstance } from 'fastify';
import type { RealClock, WorldClockService } from '../application/world-clock-service.ts';

export const registerWorldClockRoutes = (server: FastifyInstance, service: WorldClockService, now: RealClock): void => {
  server.get('/api/v1/world-clock', async (_request, reply) => {
    const segment = await service.current();
    return reply.header('cache-control', 'no-store').send({ segment, serverTimeMs: now() });
  });
};
