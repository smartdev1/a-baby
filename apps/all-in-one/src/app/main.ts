/**
 * Role: composition root of the all-in-one process (gateway + zone + services in one Node process, in-memory bus).
 * Owner: backend
 */

import { createLogger } from '@skyline/observability';
import { readServicesConfig } from '@skyline/services';
import { readAllInOneConfig } from './all-in-one-config.ts';
import { composeWorld } from './compose-world.ts';

const logger = createLogger({ service: 'all-in-one' });
// Local dev: anonymous tickets unless the environment says otherwise (the preview client and the bots use them).
const servicesConfig = readServicesConfig({ SKYLINE_ANONYMOUS_TICKETS: 'true', ...process.env });
const world = await composeWorld(readAllInOneConfig(process.env), servicesConfig, logger);
await world.services.server.listen({ host: servicesConfig.host, port: servicesConfig.port });
logger.info({ cellKey: world.cellKey, tiles: world.tilesLoaded }, 'all-in-one world running');

const shutdown = async (): Promise<void> => {
  await world.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
