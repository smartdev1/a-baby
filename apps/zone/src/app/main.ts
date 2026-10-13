/**
 * Role: composition root of the zone (cell server) process; loads assigned cells and starts the 20 Hz tick in J1.
 * Owner: backend
 */

import { createLogger } from '@skyline/observability';

const logger = createLogger({ service: 'zone' });
logger.warn('zone server is not implemented yet (milestone J1, docs/roadmap.md)');
