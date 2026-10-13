/**
 * Role: composition root of the standalone services process: builds the services and starts listening.
 * Owner: backend
 */

import { createLogger } from '@skyline/observability';
import { buildServices } from './build-services.ts';
import { readServicesConfig } from './services-config.ts';

const config = readServicesConfig(process.env);
const logger = createLogger({ service: 'services' });
const { server } = await buildServices({ config, logger });

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  await server.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await server.listen({ host: config.host, port: config.port });
