/**
 * Role: composition root of the services process: builds the HTTP server and starts listening.
 * Owner: backend
 */

import { createLogger } from '@skyline/observability';
import { buildHttpServer } from './http-server.ts';
import { readServicesConfig } from './services-config.ts';

const config = readServicesConfig(process.env);
const logger = createLogger({ service: 'services' });
const server = await buildHttpServer({ logger, corsOrigin: config.corsOrigin });

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  await server.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await server.listen({ host: config.host, port: config.port });
