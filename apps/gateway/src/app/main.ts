/**
 * Role: composition root of the WebSocket gateway process (transport, auth, sessions, routing are wired here in J1).
 * Owner: backend
 */

import { createLogger } from '@skyline/observability';

const logger = createLogger({ service: 'gateway' });
logger.warn('gateway is not implemented yet (milestone J1, docs/roadmap.md)');
