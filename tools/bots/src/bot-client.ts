/**
 * Role: one headless bot: gets a session ticket, connects to the gateway, walks at 20 Hz (seeded random walk, or straight east to cross cell borders), pings every second and records acks, RTTs, received bytes and handoffs.
 * Owner: backend
 */

import { decodeServerMessage, encodeClientMessage, type InputMessage, type ServerMessage } from '@skyline/protocol';
import WebSocket from 'ws';
import { HandoffTracker, type HandoffSample } from './handoff-tracker.ts';

export interface BotResult {
  readonly welcomed: boolean;
  readonly acks: number;
  readonly snapshots: number;
  readonly errors: string[];
  readonly rttsMs: number[];
  readonly bytesReceived: number;
  readonly handoffs: readonly HandoffSample[];
}

export type BotWalk = 'random' | 'east';

export interface BotOptions {
  readonly httpUrl: string;
  readonly wsUrl: string;
  readonly seconds: number;
  readonly seed: number;
  readonly walk?: BotWalk;
}

/** Tiny deterministic generator (no Math.random in the repo). */
const lcg = (seed: number): (() => number) => {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4_294_967_296;
};

const EAST_RAD = Math.PI / 2;
const randomInput = (seq: number, heading: number): InputMessage => ({ seq, moveX: 0, moveZ: 1, yawRad: heading, flags: { run: seq % 100 < 30, jump: seq % 97 === 0, interact: false } });
const eastInput = (seq: number): InputMessage => ({ seq, moveX: 0, moveZ: 1, yawRad: EAST_RAD, flags: { run: true, jump: false, interact: false } });

const emptyResult = (): BotResult & { errors: string[]; rttsMs: number[] } => ({ welcomed: false, acks: 0, snapshots: 0, errors: [], rttsMs: [], bytesReceived: 0, handoffs: [] });

export const runBot = async ({ httpUrl, wsUrl, seconds, seed, walk = 'random' }: BotOptions): Promise<BotResult> => {
  const result = emptyResult();
  const ticketResponse = await fetch(`${httpUrl}/api/v1/session-tickets`, { method: 'POST' });
  if (!ticketResponse.ok) return { ...result, errors: [`ticket HTTP ${ticketResponse.status}`] };
  const { ticket } = (await ticketResponse.json()) as { ticket: string };

  const tracker = new HandoffTracker();
  let welcomes = 0;
  let acks = 0;
  let snapshots = 0;
  let bytes = 0;
  const onMessage = (m: ServerMessage): void => {
    if (m.type === 'welcome') {
      welcomes++;
      tracker.onWelcome(m.body);
    } else if (m.type === 'inputAck') {
      acks++;
      tracker.onAck(m.body, performance.now());
    } else if (m.type === 'snapshot') snapshots++;
    else if (m.type === 'pong') result.rttsMs.push(performance.now() - m.body.clientTimeMs);
    else if (m.type === 'error') result.errors.push(m.body.code);
  };
  const socket = new WebSocket(wsUrl);
  socket.on('message', (data: Buffer) => {
    bytes += data.byteLength;
    onMessage(decodeServerMessage(new Uint8Array(data)));
  });
  await new Promise((resolve, reject) => socket.once('open', resolve).once('error', reject));
  socket.send(encodeClientMessage({ type: 'hello', body: { protocolVersion: 1, ticket, clientBuild: 'bot' } }));

  const random = lcg(seed);
  let heading = random() * Math.PI * 2;
  let seq = 0;
  const inputs = setInterval(() => {
    seq++;
    if (seq % 40 === 0) heading = random() * Math.PI * 2;
    socket.send(encodeClientMessage({ type: 'input', body: walk === 'east' ? eastInput(seq) : randomInput(seq, heading) }));
  }, 50);
  const pings = setInterval(
    () => socket.send(encodeClientMessage({ type: 'ping', body: { clientTimeMs: performance.now() } })),
    1000,
  );
  await new Promise((r) => setTimeout(r, seconds * 1000));
  clearInterval(inputs);
  clearInterval(pings);
  socket.close();
  return { ...result, welcomed: welcomes > 0, acks, snapshots, bytesReceived: bytes, handoffs: tracker.samples };
};
