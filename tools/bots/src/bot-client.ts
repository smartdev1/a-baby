/**
 * Role: one headless bot: gets a session ticket, connects to the gateway, walks randomly at 20 Hz (seeded), pings every second and records acks and RTTs.
 * Owner: backend
 */

import { decodeServerMessage, encodeClientMessage, type InputMessage } from '@skyline/protocol';
import WebSocket from 'ws';

export interface BotResult {
  readonly welcomed: boolean;
  readonly acks: number;
  readonly snapshots: number;
  readonly errors: string[];
  readonly rttsMs: number[];
}

export interface BotOptions {
  readonly httpUrl: string;
  readonly wsUrl: string;
  readonly seconds: number;
  readonly seed: number;
}

/** Tiny deterministic generator (no Math.random in the repo). */
const lcg = (seed: number): (() => number) => {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4_294_967_296;
};

const inputAt = (seq: number, heading: number): InputMessage => ({
  seq,
  moveX: 0,
  moveZ: 1,
  yawRad: heading,
  flags: { run: seq % 100 < 30, jump: seq % 97 === 0, interact: false },
});

export const runBot = async ({ httpUrl, wsUrl, seconds, seed }: BotOptions): Promise<BotResult> => {
  const result = { welcomed: false, acks: 0, snapshots: 0, errors: [] as string[], rttsMs: [] as number[] };
  const ticketResponse = await fetch(`${httpUrl}/api/v1/session-tickets`, { method: 'POST' });
  if (!ticketResponse.ok) return { ...result, errors: [`ticket HTTP ${ticketResponse.status}`] };
  const { ticket } = (await ticketResponse.json()) as { ticket: string };

  const socket = new WebSocket(wsUrl);
  socket.on('message', (data: Buffer) => {
    const m = decodeServerMessage(new Uint8Array(data));
    if (m.type === 'welcome') result.welcomed = true;
    else if (m.type === 'inputAck') result.acks++;
    else if (m.type === 'snapshot') result.snapshots++;
    else if (m.type === 'pong') result.rttsMs.push(performance.now() - m.body.clientTimeMs);
    else if (m.type === 'error') result.errors.push(m.body.code);
  });
  await new Promise((resolve, reject) => socket.once('open', resolve).once('error', reject));
  socket.send(encodeClientMessage({ type: 'hello', body: { protocolVersion: 1, ticket, clientBuild: 'bot' } }));

  const random = lcg(seed);
  let heading = random() * Math.PI * 2;
  let seq = 0;
  const inputs = setInterval(() => {
    seq++;
    if (seq % 40 === 0) heading = random() * Math.PI * 2;
    socket.send(encodeClientMessage({ type: 'input', body: inputAt(seq, heading) }));
  }, 50);
  const pings = setInterval(
    () => socket.send(encodeClientMessage({ type: 'ping', body: { clientTimeMs: performance.now() } })),
    1000,
  );
  await new Promise((r) => setTimeout(r, seconds * 1000));
  clearInterval(inputs);
  clearInterval(pings);
  socket.close();
  return result;
};
