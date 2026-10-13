/**
 * Role: builds the Fastify HTTP server with security plugins and the /health and /ready endpoints.
 * Owner: backend
 */

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import type { Logger } from '@skyline/observability';

export interface HttpServerDeps {
  logger: Logger;
  corsOrigin: string;
}

export const buildHttpServer = async ({ logger, corsOrigin }: HttpServerDeps) => {
  const server = Fastify({ loggerInstance: logger });

  await server.register(helmet);
  await server.register(cors, { origin: corsOrigin });
  await server.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  server.get('/health', (_request, reply) => reply.send({ status: 'ok' }));
  // Becomes "not ready" once dependencies (database, bus) are wired in J1/J6.
  server.get('/ready', (_request, reply) => reply.send({ status: 'ready' }));

  return server;
};
