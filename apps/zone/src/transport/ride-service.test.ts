/**
 * Role: tests line rides: refusals (unknown line, no stop nearby, wrong direction, unreachable stop, no vehicle with the next arrival, full vehicle, insufficient funds), boarding with a single fare even on replay, and arrival at the stop after the accelerated trip.
 * Owner: backend
 */

import type { UtmPosition } from '@skyline/geo';
import type { RideUpdateMessage, ServerMessage } from '@skyline/protocol';
import { buildLineSchedule } from '@skyline/sim-transport';
import { describe, expect, it } from 'vitest';
import { grantStarterMoney, InMemoryEconomy } from '../adapters/in-memory-economy.ts';
import { RideService } from './ride-service.ts';
import type { TransitLine } from './transit-network.ts';

const E = 381_000;
const N = 589_000;
const stops = [
  { id: 'osm:node/1', utm: { eastingM: E, northingM: N } },
  { id: 'osm:node/2', utm: { eastingM: E + 1000, northingM: N } },
  { id: 'osm:node/3', utm: { eastingM: E + 2000, northingM: N } },
];
const schedule = buildLineSchedule(
  { id: 'osm:relation/7', path: [[E, N], [E + 2000, N]], stops: stops.map((s) => ({ id: s.id, position: [s.utm.eastingM, s.utm.northingM] as [number, number] })) },
  { cruiseKmh: 36, dwellGameMin: 2, periods: [{ fromMin: 0, toMin: 1440, headwayMin: 30 }] },
  12,
);
const line: TransitLine = { id: 'osm:relation/7', schedule, stops, seats: 1, fareDjai: 150 };
/** A vehicle dwells at the first stop from the first departure for 2 game minutes. */
const docked = schedule.phase * 30 + 1;

const setup = (gameMinute = docked) => {
  const economy = new InMemoryEconomy();
  const sent: [string, ServerMessage][] = [];
  const positions = new Map<string, UtmPosition>([['s1', { eastingM: E + 5, northingM: N }], ['s2', { eastingM: E, northingM: N + 10 }], ['far', { eastingM: E + 500, northingM: N }]]);
  let realMs = 0;
  const rides = new RideService(
    {
      network: new Map([[line.id, line]]),
      economy,
      gameMinute: () => gameMinute,
      clockRatio: () => 12,
      realNow: () => realMs,
      reachable: (utm) => utm.eastingM < E + 1500,
      send: (s, m) => sent.push([s, m]),
      refreshWallet: () => Promise.resolve(),
    },
    { characterOf: (s) => s, utmOf: (s) => positions.get(s) ?? null },
  );
  const ask = (s: string, toStopId = 'osm:node/2', requestId = `req-${s}-0001`) => rides.request(s, { requestId, lineId: line.id, toStopId });
  const last = (s: string): RideUpdateMessage | undefined => {
    const m = sent.filter(([who, msg]) => who === s && msg.type === 'rideUpdate').at(-1)?.[1];
    return m?.type === 'rideUpdate' ? m.body : undefined;
  };
  return { economy, rides, ask, last, sent, advance: (ms: number) => (realMs += ms) };
};

describe('line rides', () => {
  it('should refuse unknown lines, players away from stops, wrong directions and unreachable stops', async () => {
    const { ask, last, rides } = setup();
    await rides.request('s1', { requestId: 'req-x-0001', lineId: 'osm:relation/9', toStopId: 'osm:node/2' });
    expect(last('s1')?.refusals).toEqual([{ code: 'unknown_line' }]);
    await ask('far');
    expect(last('far')?.refusals).toEqual([{ code: 'no_stop_nearby' }]);
    await ask('s1', 'osm:node/1');
    expect(last('s1')?.refusals).toEqual([{ code: 'wrong_direction' }]);
    await ask('s1', 'osm:node/3');
    expect(last('s1')?.refusals).toEqual([{ code: 'unreachable' }]);
  });

  it('should refuse when no vehicle is docked and give the next arrival', async () => {
    const { ask, last } = setup(docked + 10);
    await ask('s1');
    expect(last('s1')).toMatchObject({ state: 'rejected', refusals: [{ code: 'no_vehicle', nextInGameMin: 19 }] });
  });

  it('should board once, charge the fare once, fill the seat and land the rider at the stop', async () => {
    const { economy, ask, last, rides, advance } = setup();
    await grantStarterMoney(economy, 's1', 1000);
    await grantStarterMoney(economy, 's2', 1000);
    await ask('s1');
    const boarded = last('s1');
    expect(boarded).toMatchObject({ state: 'boarded', fareDjai: 150 });
    // 1 000 m at 50 m per game minute = 20 game min + 2 min dwell = 100 real s at ratio 12; a sixth ⇒ 16.7 s.
    expect(boarded?.arriveInMs).toBe(16_667);
    await ask('s1'); // replay
    expect(await economy.balanceOf('character:s1')).toBe(850n);
    expect(rides.isRiding('s1')).toBe(true);
    await ask('s2');
    expect(last('s2')?.refusals).toEqual([{ code: 'full' }]);
    advance(16_000);
    expect(rides.arrivals()).toEqual([]);
    advance(1_000);
    expect(rides.arrivals()).toEqual([{ sessionId: 's1', destination: stops[1]?.utm }]);
    expect(last('s1')?.state).toBe('arrived');
    expect(rides.isRiding('s1')).toBe(false);
  });

  it('should refuse a rider who cannot pay', async () => {
    const { ask, last, rides } = setup();
    await ask('s1');
    expect(last('s1')?.refusals).toEqual([{ code: 'insufficient_funds' }]);
    expect(rides.isRiding('s1')).toBe(false);
  });
});
