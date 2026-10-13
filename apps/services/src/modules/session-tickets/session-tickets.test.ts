/**
 * Role: tests session tickets: single use, expiry after 60 s, unknown tickets refused, HTTP issuance, loopback-only internal consumption.
 * Owner: backend
 */

import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerInternalTicketRoutes } from './api/internal-ticket-routes.ts';
import { registerSessionTicketRoutes } from './api/session-ticket-routes.ts';
import { TICKET_TTL_MS, TicketService } from './application/ticket-service.ts';

describe('TicketService', () => {
  it('should accept a ticket once', () => {
    const service = new TicketService(() => 0);
    const { ticket } = service.issue();
    expect(ticket).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(service.consume(ticket)).toBe(true);
    expect(service.consume(ticket)).toBe(false);
    expect(service.consume('forged')).toBe(false);
  });

  it('should refuse an expired ticket', () => {
    let now = 0;
    const service = new TicketService(() => now);
    const { ticket } = service.issue();
    now = TICKET_TTL_MS + 1;
    expect(service.consume(ticket)).toBe(false);
  });

  it('should issue tickets over HTTP', async () => {
    const server = Fastify();
    registerSessionTicketRoutes(server, new TicketService(() => 0));
    const response = await server.inject({ method: 'POST', url: '/api/v1/session-tickets' });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ expiresInMs: TICKET_TTL_MS });
    await server.close();
  });

  it('should let a loopback gateway consume a ticket once and refuse other callers', async () => {
    const server = Fastify();
    const service = new TicketService(() => 0);
    registerInternalTicketRoutes(server, service);
    const { ticket } = service.issue();
    const consume = (remoteAddress: string) => server.inject({ method: 'POST', url: '/internal/v1/session-tickets/consume', payload: { ticket }, remoteAddress });
    expect((await consume('10.0.0.5')).statusCode).toBe(403);
    expect((await consume('127.0.0.1')).json()).toEqual({ valid: true });
    expect((await consume('127.0.0.1')).json()).toEqual({ valid: false });
    const bad = await server.inject({ method: 'POST', url: '/internal/v1/session-tickets/consume', payload: { ticket: 3 }, remoteAddress: '127.0.0.1' });
    expect(bad.statusCode).toBe(400);
    await server.close();
  });
});
