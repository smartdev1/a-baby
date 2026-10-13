/**
 * Role: binary codecs of `ping` (client clock) and `pong` (client clock echoed + server clock), used for RTT and clock offset estimation.
 * Owner: backend
 */

import type { FrameReader } from '../binary/frame-reader.ts';
import { FrameWriter } from '../binary/frame-writer.ts';
import { CLIENT_MESSAGE, SERVER_MESSAGE } from '../message-types.ts';

export interface PingMessage {
  readonly clientTimeMs: number;
}

export interface PongMessage {
  readonly clientTimeMs: number;
  readonly serverTimeMs: number;
}

export const encodePing = (m: PingMessage): Uint8Array =>
  new FrameWriter(9).u8(CLIENT_MESSAGE.ping).f64(m.clientTimeMs).done();
export const decodePing = (r: FrameReader): PingMessage => ({ clientTimeMs: r.f64('clientTimeMs') });

export const encodePong = (m: PongMessage): Uint8Array =>
  new FrameWriter(17).u8(SERVER_MESSAGE.pong).f64(m.clientTimeMs).f64(m.serverTimeMs).done();
export const decodePong = (r: FrameReader): PongMessage => ({
  clientTimeMs: r.f64('clientTimeMs'),
  serverTimeMs: r.f64('serverTimeMs'),
});
