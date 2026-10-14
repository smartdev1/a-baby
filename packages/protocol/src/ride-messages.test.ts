/**
 * Role: tests the line ride and taxi messages (protocol v4, v6): round trips of the requests and updates, refusal of malformed line, stop or place ids.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { type ClientMessage, decodeClientMessage, decodeServerMessage, encodeClientMessage, encodeServerMessage, ProtocolDecodeError, type ServerMessage } from './index.ts';

describe('ride messages', () => {
  it('should round-trip the ride request and update', () => {
    const request: ClientMessage = { type: 'rideRequest', body: { requestId: 'ride-0001', lineId: 'osm:relation/10087879', toStopId: 'osm:node/6831076677' } };
    expect(decodeClientMessage(encodeClientMessage(request))).toEqual(request);
    const update: ServerMessage = {
      type: 'rideUpdate',
      body: { requestId: 'ride-0001', lineId: 'osm:relation/10087879', toStopId: 'osm:node/6831076677', state: 'rejected', fareDjai: 0, arriveInMs: 0, refusals: [{ code: 'no_vehicle', nextInGameMin: 12 }] },
    };
    expect(decodeServerMessage(encodeServerMessage(update))).toEqual(update);
  });

  it('should refuse malformed line and stop ids', () => {
    const bad = encodeClientMessage({ type: 'rideRequest', body: { requestId: 'ride-0001', lineId: 'osm:way/1', toStopId: 'osm:node/2' } });
    expect(() => decodeClientMessage(bad)).toThrow(ProtocolDecodeError);
  });

  it('should round-trip the taxi request and update', () => {
    const request: ClientMessage = { type: 'taxiRequest', body: { requestId: 'taxi-0001', destinationPlaceId: 'osm:way/42' } };
    expect(decodeClientMessage(encodeClientMessage(request))).toEqual(request);
    const update: ServerMessage = { type: 'taxiUpdate', body: { requestId: 'taxi-0001', destinationPlaceId: 'osm:way/42', state: 'assigned', etaMs: 15_000, fareDjai: 1050, distanceM: 3000, refusals: [] } };
    expect(decodeServerMessage(encodeServerMessage(update))).toEqual(update);
    const bad = encodeClientMessage({ type: 'taxiRequest', body: { requestId: 'taxi-0001', destinationPlaceId: 'home' } });
    expect(() => decodeClientMessage(bad)).toThrow(ProtocolDecodeError);
  });
});
