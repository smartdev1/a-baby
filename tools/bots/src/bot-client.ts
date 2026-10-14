/**
 * Role: one headless bot: gets a session ticket, connects to the gateway, plays a scenario at 20 Hz (`bot-scenarios.ts`), pings every second and records acks, RTTs, received bytes, handoffs, messages per type and taxi states.
 * Owner: backend
 */

import { decodeServerMessage, encodeClientMessage, PROTOCOL_VERSION, type ServerMessage } from '@skyline/protocol';
import WebSocket from 'ws';
import { type BotScenario, type BotState, extrasFor, inputFor } from './bot-scenarios.ts';
import { HandoffTracker, type HandoffSample } from './handoff-tracker.ts';

export interface BotResult {
  readonly welcomed: boolean;
  readonly acks: number;
  readonly snapshots: number;
  readonly errors: string[];
  readonly rttsMs: number[];
  readonly bytesReceived: number;
  readonly handoffs: readonly HandoffSample[];
  /** Server messages received per type. */
  readonly counts: Readonly<Record<string, number>>;
  readonly chatSent: number;
  /** Entities received across all snapshots (interest set size). */
  readonly entitiesSeen: number;
  /** Last taxi state (`assigned`, `boarded`, `arrived`, `rejected:<code>`…), if any. */
  readonly taxi: string | null;
}

export interface BotOptions {
  readonly httpUrl: string;
  readonly wsUrl: string;
  readonly seconds: number;
  readonly seed: number;
  readonly scenario?: BotScenario;
  /** Place id for the `social` scenario's taxi request. */
  readonly taxiPlace?: string | null;
}

/** Tiny deterministic generator (no Math.random in the repo). */
const lcg = (seed: number): (() => number) => {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4_294_967_296;
};

const emptyResult = (): BotResult & { errors: string[]; rttsMs: number[] } => ({ welcomed: false, acks: 0, snapshots: 0, errors: [], rttsMs: [], bytesReceived: 0, handoffs: [], counts: {}, chatSent: 0, entitiesSeen: 0, taxi: null });

const taxiState = (m: Extract<ServerMessage, { type: 'taxiUpdate' }>): string => (m.body.refusals[0] ? `${m.body.state}:${m.body.refusals[0].code}` : m.body.state);

export const runBot = async ({ httpUrl, wsUrl, seconds, seed, scenario = 'random', taxiPlace = null }: BotOptions): Promise<BotResult> => {
  const result = emptyResult();
  const ticketResponse = await fetch(`${httpUrl}/api/v1/session-tickets`, { method: 'POST' });
  if (!ticketResponse.ok) return { ...result, errors: [`ticket HTTP ${ticketResponse.status}`] };
  const { ticket } = (await ticketResponse.json()) as { ticket: string };

  const tracker = new HandoffTracker();
  let welcomes = 0;
  let acks = 0;
  let snapshots = 0;
  let bytes = 0;
  const counts: Record<string, number> = {};
  let taxi: string | null = null;
  let entitiesSeen = 0;
  let position: { x: number; z: number } | null = null;
  let spawn: { x: number; z: number } | null = null;
  const onMessage = (m: ServerMessage): void => {
    counts[m.type] = (counts[m.type] ?? 0) + 1;
    if (m.type === 'welcome') {
      welcomes++;
      tracker.onWelcome(m.body);
    } else if (m.type === 'inputAck') {
      acks++;
      tracker.onAck(m.body, performance.now());
      position = { x: m.body.position.x, z: m.body.position.z };
      spawn ??= position;
    } else if (m.type === 'snapshot') {
      snapshots++;
      entitiesSeen += m.body.entities.length;
    } else if (m.type === 'taxiUpdate') taxi = taxiState(m);
    else if (m.type === 'pong') result.rttsMs.push(performance.now() - m.body.clientTimeMs);
    else if (m.type === 'error') result.errors.push(m.body.code);
  };
  const socket = new WebSocket(wsUrl);
  socket.on('message', (data: Buffer) => {
    bytes += data.byteLength;
    onMessage(decodeServerMessage(new Uint8Array(data)));
  });
  await new Promise((resolve, reject) => socket.once('open', resolve).once('error', reject));
  socket.send(encodeClientMessage({ type: 'hello', body: { protocolVersion: PROTOCOL_VERSION, ticket, clientBuild: 'bot' } }));

  const random = lcg(seed);
  let heading = random() * Math.PI * 2;
  let seq = 0;
  let chatSent = 0;
  const inputs = setInterval(() => {
    seq++;
    const state: BotState = { seq, random, position, spawn, heading };
    socket.send(encodeClientMessage({ type: 'input', body: inputFor(scenario, state) }));
    for (const extra of extrasFor(scenario, state, seed, taxiPlace)) {
      if (extra.type === 'chatSend') chatSent++;
      socket.send(encodeClientMessage(extra));
    }
    heading = state.heading;
  }, 50);
  const pings = setInterval(
    () => socket.send(encodeClientMessage({ type: 'ping', body: { clientTimeMs: performance.now() } })),
    1000,
  );
  await new Promise((r) => setTimeout(r, seconds * 1000));
  clearInterval(inputs);
  clearInterval(pings);
  socket.close();
  return { ...result, welcomed: welcomes > 0, acks, snapshots, bytesReceived: bytes, handoffs: tracker.samples, counts, chatSent, entitiesSeen, taxi };
};
