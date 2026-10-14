/**
 * Role: what a bot does each input tick, per scenario (J5-10): `random` walk, `east` (crosses cell borders), `market` (the crowd converges on one point 40 m north of the spawn and mills around it), `social` (random walk + proximity chat every few seconds + one taxi request when a place is given).
 * Owner: backend
 */

import type { ClientMessage, InputMessage } from '@skyline/protocol';

export const SCENARIOS = ['random', 'east', 'market', 'social'] as const;
export type BotScenario = (typeof SCENARIOS)[number];

export interface BotState {
  readonly seq: number;
  readonly random: () => number;
  /** Last authoritative position (frame metres) and the frame of the first cell. */
  readonly position: { readonly x: number; readonly z: number } | null;
  readonly spawn: { readonly x: number; readonly z: number } | null;
  heading: number;
}

const EAST_RAD = Math.PI / 2;
const MARKET_OFFSET_M = 40;
const MARKET_RADIUS_M = 10;
const CHAT_EVERY_TICKS = 100;
const TAXI_AT_TICK = 200;
const LINES = ['On dit quoi ?', 'Le garba est bon ici', 'Tu vas où ?', 'Gbaka pour Adjamé ?', 'On se voit au maquis', "C'est chaud aujourd'hui"];

/** Forward is +z at yaw 0 and +x at yaw π/2 (same convention as the controller). */
const headingTowards = (from: { x: number; z: number }, to: { x: number; z: number }): number => Math.atan2(to.x - from.x, to.z - from.z);

const marketHeading = (s: BotState): { heading: number; run: boolean } => {
  if (!s.position || !s.spawn) return { heading: s.heading, run: false };
  const target = { x: s.spawn.x, z: s.spawn.z + MARKET_OFFSET_M };
  const d = Math.hypot(target.x - s.position.x, target.z - s.position.z);
  if (d > MARKET_RADIUS_M) return { heading: headingTowards(s.position, target), run: d > 30 };
  if (s.seq % 20 === 0) s.heading = s.random() * Math.PI * 2;
  return { heading: s.heading, run: false };
};

export const inputFor = (scenario: BotScenario, s: BotState): InputMessage => {
  if (scenario === 'east') return { seq: s.seq, moveX: 0, moveZ: 1, yawRad: EAST_RAD, flags: { run: true, jump: false, interact: false } };
  if (scenario === 'market') {
    const { heading, run } = marketHeading(s);
    return { seq: s.seq, moveX: 0, moveZ: 1, yawRad: heading, flags: { run, jump: false, interact: false } };
  }
  if (s.seq % 40 === 0) s.heading = s.random() * Math.PI * 2;
  return { seq: s.seq, moveX: 0, moveZ: 1, yawRad: s.heading, flags: { run: s.seq % 100 < 30, jump: s.seq % 97 === 0, interact: false } };
};

/** Extra messages of the tick: chat lines (with a seeded offset so bots do not all talk at once) and one taxi request. */
export const extrasFor = (scenario: BotScenario, s: BotState, botId: number, taxiPlace: string | null): ClientMessage[] => {
  if (scenario !== 'social') return [];
  const out: ClientMessage[] = [];
  if ((s.seq + botId * 7) % CHAT_EVERY_TICKS === 0) out.push({ type: 'chatSend', body: { channel: 'proximity', text: LINES[Math.floor(s.random() * LINES.length)] ?? 'Bonsoir' } });
  if (taxiPlace && s.seq === TAXI_AT_TICK) out.push({ type: 'taxiRequest', body: { requestId: `bot-${botId}-taxi-0001`, destinationPlaceId: taxiPlace } });
  return out;
};
