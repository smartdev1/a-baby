/**
 * Role: public API of the services app, used by the all-in-one composition.
 * Owner: backend
 */

export { buildServices, type BuildServicesOptions, type Services } from './app/build-services.ts';
export { readServicesConfig, type ServicesConfig } from './app/services-config.ts';
export type { TicketService } from './modules/session-tickets/application/ticket-service.ts';
