/**
 * Role: tests session tickets: single use, expiry after 60 s, unknown tickets refused, issuance bound to the guest account (anonymous only when allowed), loopback-only internal consumption returning the account.
 * Owner: backend
 */

import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerInternalTicketRoutes } from './api/internal-ticket-routes.ts';
import { registerSessionTicketRoutes } from './api/session-ticket-routes.ts';
import { TICKET_TTL_MS, TicketService } from './application/ticket-service.ts';
import { AccountService } from '../accounts/application/account-service.ts';
import { InMemoryGuestAccountStore } from '../accounts/infra/guest-account-stores.ts';

describe('TicketService', () => {
  it('should accept a ticket once', () => {
    const service = new TicketService(() => 0);
    const { ticket } = service.issue();
    expect(ticket).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(service.consume(ticket)).toEqual({ accountId: null });
    expect(service.consume(ticket)).toBeNull();
    expect(service.consume('forged')).toBeNull();
  });

  it('should refuse an expired ticket', () => {
    let now = 0;
    const service = new TicketService(() => now);
    const { ticket } = service.issue();
    now = TICKET_TTL_MS + 1;
    expect(service.consume(ticket)).toBeNull();
  });

  it('should issue tickets bound to the guest account, anonymous ones only when allowed', async () => {
    const accounts = new AccountService(new InMemoryGuestAccountStore(), () => 0);
    const tickets = new TicketService(() => 0);
    const strict = Fastify();
    registerSessionTicketRoutes(strict, tickets, { accounts });
    expect((await strict.inject({ method: 'POST', url: '/api/v1/session-tickets' })).statusCode).toBe(401);
    const guest = await accounts.createGuest();
    const response = await strict.inject({ method: 'POST', url: '/api/v1/session-tickets', headers: { authorization: `Bearer ${guest.accessToken}` } });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ expiresInMs: TICKET_TTL_MS });
    expect(tickets.consume(response.json<{ ticket: string }>().ticket)).toEqual({ accountId: guest.accountId });
    const dev = Fastify();
    registerSessionTicketRoutes(dev, tickets, { accounts, anonymous: true });
    expect((await dev.inject({ method: 'POST', url: '/api/v1/session-tickets' })).statusCode).toBe(201);
    await strict.close();
    await dev.close();
  });

  it('should let a loopback gateway consume a ticket once and refuse other callers', async () => {
    const server = Fastify();
    const service = new TicketService(() => 0);
    registerInternalTicketRoutes(server, service);
    const { ticket } = service.issue('acc_7');
    const consume = (remoteAddress: string) => server.inject({ method: 'POST', url: '/internal/v1/session-tickets/consume', payload: { ticket }, remoteAddress });
    expect((await consume('10.0.0.5')).statusCode).toBe(403);
    expect((await consume('127.0.0.1')).json()).toEqual({ valid: true, accountId: 'acc_7' });
    expect((await consume('127.0.0.1')).json()).toEqual({ valid: false });
    const bad = await server.inject({ method: 'POST', url: '/internal/v1/session-tickets/consume', payload: { ticket: 3 }, remoteAddress: '127.0.0.1' });
    expect(bad.statusCode).toBe(400);
    await server.close();
  });
});
