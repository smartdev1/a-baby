/**
 * Role: composition root of the services process: builds the HTTP server and starts listening.
 * Owner: backend
 */

import { join } from 'node:path';
import { createLogger } from '@skyline/observability';
import { registerWorldClockRoutes } from '../modules/world-clock/api/world-clock-routes.ts';
import { WorldClockService } from '../modules/world-clock/application/world-clock-service.ts';
import { FileClockSegmentStore } from '../modules/world-clock/infra/clock-segment-stores.ts';
import { buildHttpServer } from './http-server.ts';
import { loadClockConfig } from './load-game-config.ts';
import { readServicesConfig } from './services-config.ts';

const config = readServicesConfig(process.env);
const logger = createLogger({ service: 'services' });
const now = (): number => Date.now();
const worldClock = new WorldClockService(new FileClockSegmentStore(join(config.runtimeDir, 'world-clock.json')), await loadClockConfig(config.contentDir), now);
const server = await buildHttpServer({
  logger,
  corsOrigin: config.corsOrigin,
  registerRoutes: (app) => registerWorldClockRoutes(app, worldClock, now),
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  await server.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await server.listen({ host: config.host, port: config.port });
