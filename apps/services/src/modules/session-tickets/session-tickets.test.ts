/**
 * Role: tests session tickets: single use, expiry after 60 s, unknown tickets refused, HTTP issuance.
 * Owner: backend
 */

import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
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
});
