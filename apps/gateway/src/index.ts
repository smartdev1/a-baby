/**
 * Role: public API of the gateway app, used by the all-in-one composition: start the WebSocket gateway.
 * Owner: backend
 */

export { startGateway, type Gateway, type GatewayOptions } from './transport/ws-gateway.ts';
export type { TicketVerifier } from './auth/ticket-verifier.ts';
