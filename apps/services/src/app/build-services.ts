/**
 * Role: builds the services process (HTTP server, world clock, guest accounts, session tickets) without listening, so the standalone main and the all-in-one composition share it.
 * Owner: backend
 */

import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import type { Logger } from '@skyline/observability';
import { registerAccountRoutes } from '../modules/accounts/api/account-routes.ts';
import { AccountService } from '../modules/accounts/application/account-service.ts';
import { FileGuestAccountStore } from '../modules/accounts/infra/guest-account-stores.ts';
import { registerInternalTicketRoutes } from '../modules/session-tickets/api/internal-ticket-routes.ts';
import { registerSessionTicketRoutes } from '../modules/session-tickets/api/session-ticket-routes.ts';
import { TicketService } from '../modules/session-tickets/application/ticket-service.ts';
import { registerWorldClockRoutes } from '../modules/world-clock/api/world-clock-routes.ts';
import { WorldClockService } from '../modules/world-clock/application/world-clock-service.ts';
import { FileClockSegmentStore } from '../modules/world-clock/infra/clock-segment-stores.ts';
import { buildHttpServer } from './http-server.ts';
import { loadClockConfig } from './load-game-config.ts';
import type { ServicesConfig } from './services-config.ts';

export interface Services {
  readonly server: Awaited<ReturnType<typeof buildHttpServer>>;
  readonly worldClock: WorldClockService;
  readonly tickets: TicketService;
  readonly accounts: AccountService;
}

export interface BuildServicesOptions {
  readonly config: ServicesConfig;
  readonly logger: Logger;
  /** Extra routes from the composition (e.g. dev statistics in all-in-one mode). */
  readonly extraRoutes?: (server: FastifyInstance) => void;
}

export const buildServices = async ({ config, logger, extraRoutes }: BuildServicesOptions): Promise<Services> => {
  const now = (): number => Date.now();
  const worldClock = new WorldClockService(
    new FileClockSegmentStore(join(config.runtimeDir, 'world-clock.json')),
    await loadClockConfig(config.contentDir),
    now,
  );
  const tickets = new TicketService(now);
  const accounts = new AccountService(new FileGuestAccountStore(join(config.runtimeDir, 'guest-accounts.json')), now);
  const server = await buildHttpServer({
    logger,
    corsOrigin: config.corsOrigin,
    registerRoutes: (app) => {
      registerWorldClockRoutes(app, worldClock, now);
      registerAccountRoutes(app, accounts);
      registerSessionTicketRoutes(app, tickets, { accounts, perMinute: config.ticketsPerMin, anonymous: config.anonymousTickets });
      if (config.internalRoutes) registerInternalTicketRoutes(app, tickets);
      extraRoutes?.(app);
    },
  });
  return { server, worldClock, tickets, accounts };
};
