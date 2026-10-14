/**
 * Role: end-to-end test of the all-in-one mode over a real WebSocket: ticket → hello → resume info + welcome + world clock → inputs → authoritative acks; daily life: starter Djai, needs, refused action request.
 * Owner: backend
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@skyline/observability';
import { decodeServerMessage, encodeClientMessage, type ServerMessage, PROTOCOL_VERSION } from '@skyline/protocol';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { composeWorld, type World } from './compose-world.ts';

const content = fileURLToPath(new URL('../../../../content', import.meta.url));
let world: World;
let runtimeDir = '';

beforeAll(async () => {
  runtimeDir = await mkdtemp(join(tmpdir(), 'aio-'));
  world = await composeWorld(
    { gatewayPort: 0, worldDir: join(runtimeDir, 'no-world'), spawn: { lonDeg: -4.0681, latDeg: 5.329 }, starterDjai: 5000 },
    { host: '127.0.0.1', port: 0, corsOrigin: '*', contentDir: content, runtimeDir, ticketsPerMin: 10, internalRoutes: false },
    createLogger({ service: 'e2e', level: 'silent' }),
  );
  await world.services.server.listen({ host: '127.0.0.1', port: 0 });
});
afterAll(async () => {
  await world.close();
  await rm(runtimeDir, { recursive: true, force: true });
});

describe('all-in-one', () => {
  it('should let a guest connect and walk with server-validated movement', async () => {
    const ticketResponse = await world.services.server.inject({ method: 'POST', url: '/api/v1/session-tickets' });
    const { ticket } = ticketResponse.json<{ ticket: string }>();
    const socket = new WebSocket(`ws://127.0.0.1:${world.gateway.port()}/ws`);
    const received: ServerMessage[] = [];
    socket.on('message', (data: Buffer) => received.push(decodeServerMessage(new Uint8Array(data))));
    await new Promise((resolve) => socket.once('open', resolve));
    socket.send(encodeClientMessage({ type: 'hello', body: { protocolVersion: PROTOCOL_VERSION, ticket, clientBuild: 'e2e' } }));
    for (let seq = 1; seq <= 10; seq++) {
      socket.send(
        encodeClientMessage({
          type: 'input',
          body: { seq, moveX: 0, moveZ: 1, yawRad: 0, flags: { run: false, jump: false, interact: false } },
        }),
      );
      await new Promise((r) => setTimeout(r, 50));
    }
    const requestId = '0b9d6a2e-0000-4000-8000-000000000001';
    socket.send(encodeClientMessage({ type: 'actionRequest', body: { requestId, actionId: 'food.eat_garba', placeId: 'osm:node/1' } }));
    await new Promise((r) => setTimeout(r, 300));
    socket.close();

    expect(received[0]).toMatchObject({ type: 'resumeInfo', body: { windowS: 60 } });
    expect(received[1]).toMatchObject({ type: 'welcome', body: { cellKey: world.cellKey, tickRateHz: 20 } });
    expect(received.some((m) => m.type === 'worldClock')).toBe(true);
    const lastAck = received.filter((m) => m.type === 'inputAck').at(-1);
    expect(lastAck?.type === 'inputAck' && lastAck.body.lastSeq).toBe(10);
    expect(received.some((m) => m.type === 'snapshot')).toBe(true);
    expect(received.find((m) => m.type === 'walletUpdate')).toMatchObject({ body: { djai: 5000 } });
    expect(received.find((m) => m.type === 'needsUpdate')).toMatchObject({ body: { values: { hunger: 80 } } });
    expect(received.find((m) => m.type === 'actionUpdate')).toMatchObject({ body: { requestId, state: 'rejected', refusals: [{ code: 'unknown_place' }] } });
  });
});
