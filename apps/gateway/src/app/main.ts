/**
 * Role: composition root of the standalone WebSocket gateway process: NATS bus, tickets checked by the services process, sessions routed to the zone processes.
 * Owner: backend
 */

import { NatsBus } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { HttpTicketVerifier } from '../auth/http-ticket-verifier.ts';
import { startGateway } from '../transport/ws-gateway.ts';
import { readGatewayConfig } from './gateway-config.ts';

const config = readGatewayConfig(process.env);
const logger = createLogger({ service: 'gateway' });
const bus = await NatsBus.connect(config.natsUrl, (subject, error) => logger.error({ subject, err: error }, 'bus handler failed'));
const gateway = startGateway({ port: config.port, bus, tickets: new HttpTicketVerifier(config.servicesUrl), spawnCell: config.spawnCell, logger });
logger.info({ port: gateway.port(), spawnCell: config.spawnCell }, 'gateway listening');

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  await gateway.close();
  await bus.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
