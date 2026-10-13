/**
 * Role: binary codecs of the hot-path movement messages: `input` (client intent), `input_ack` (authoritative state for reconciliation), `snapshot` (nearby entities).
 * Owner: backend
 */

import type { FrameReader } from '../binary/frame-reader.ts';
import { FrameWriter } from '../binary/frame-writer.ts';
import {
  assertCount,
  axisToI8,
  cmToSpeed,
  i8ToAxis,
  metresToMm,
  mmToMetres,
  speedToCm,
  u16ToYaw,
  yawToU16,
} from '../binary/quantize.ts';
import { CLIENT_MESSAGE, SERVER_MESSAGE } from '../message-types.ts';
import { ProtocolDecodeError } from '../protocol-errors.ts';

/** Metres relative to the frame origin sent in `welcome`: x = east, y = up, z = north. */
export interface Vec3M {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface InputFlags {
  readonly run: boolean;
  readonly jump: boolean;
  readonly interact: boolean;
}

/** What the player wants to do this tick — never a position (server authority). */
export interface InputMessage {
  readonly seq: number;
  /** Strafe (−1 left … 1 right) and forward (−1 back … 1 forward) relative to `yawRad`. */
  readonly moveX: number;
  readonly moveZ: number;
  readonly yawRad: number;
  readonly flags: InputFlags;
}

export interface InputAckMessage {
  readonly lastSeq: number;
  readonly tick: number;
  readonly position: Vec3M;
  readonly velocity: Vec3M;
}

export interface EntityState {
  readonly id: number;
  readonly position: Vec3M;
  readonly yawRad: number;
  /** Animation / posture code (0 idle, 1 walk, 2 run, 3 jump…). */
  readonly state: number;
}

export interface SnapshotMessage {
  readonly tick: number;
  readonly entities: readonly EntityState[];
}

export const MAX_SNAPSHOT_ENTITIES = 512;
const FLAG_BITS = { run: 1, jump: 2, interact: 4 } as const;
const KNOWN_FLAGS = 7;
const ENTITY_BYTES = 4 + 12 + 2 + 1;

const writeVec = (w: FrameWriter, v: Vec3M): void => {
  w.i32(metresToMm(v.x)).i32(metresToMm(v.y)).i32(metresToMm(v.z));
};
const readVec = (r: FrameReader, what: string): Vec3M => ({
  x: mmToMetres(r.i32(what)),
  y: mmToMetres(r.i32(what)),
  z: mmToMetres(r.i32(what)),
});

export const encodeInput = (m: InputMessage): Uint8Array =>
  new FrameWriter(10)
    .u8(CLIENT_MESSAGE.input)
    .u32(m.seq)
    .i8(axisToI8(m.moveX))
    .i8(axisToI8(m.moveZ))
    .u16(yawToU16(m.yawRad))
    .u8(
      (m.flags.run ? FLAG_BITS.run : 0) |
        (m.flags.jump ? FLAG_BITS.jump : 0) |
        (m.flags.interact ? FLAG_BITS.interact : 0),
    )
    .done();

export const decodeInput = (r: FrameReader): InputMessage => {
  const seq = r.u32('seq');
  const moveX = i8ToAxis(r.i8('moveX'));
  const moveZ = i8ToAxis(r.i8('moveZ'));
  const yawRad = u16ToYaw(r.u16('yaw'));
  const bits = r.u8('flags');
  if ((bits & ~KNOWN_FLAGS) !== 0) throw new ProtocolDecodeError('out-of-range', `unknown input flags ${bits}`);
  return {
    seq,
    moveX,
    moveZ,
    yawRad,
    flags: {
      run: (bits & FLAG_BITS.run) !== 0,
      jump: (bits & FLAG_BITS.jump) !== 0,
      interact: (bits & FLAG_BITS.interact) !== 0,
    },
  };
};

export const encodeInputAck = (m: InputAckMessage): Uint8Array => {
  const w = new FrameWriter(27).u8(SERVER_MESSAGE.inputAck).u32(m.lastSeq).u32(m.tick);
  writeVec(w, m.position);
  w.i16(speedToCm(m.velocity.x)).i16(speedToCm(m.velocity.y)).i16(speedToCm(m.velocity.z));
  return w.done();
};

export const decodeInputAck = (r: FrameReader): InputAckMessage => ({
  lastSeq: r.u32('lastSeq'),
  tick: r.u32('tick'),
  position: readVec(r, 'position'),
  velocity: { x: cmToSpeed(r.i16('velocity')), y: cmToSpeed(r.i16('velocity')), z: cmToSpeed(r.i16('velocity')) },
});

export const encodeSnapshot = (m: SnapshotMessage): Uint8Array => {
  assertCount(m.entities.length, MAX_SNAPSHOT_ENTITIES, 'snapshot entities');
  const w = new FrameWriter(1 + 4 + 2 + m.entities.length * ENTITY_BYTES)
    .u8(SERVER_MESSAGE.snapshot)
    .u32(m.tick)
    .u16(m.entities.length);
  for (const e of m.entities) {
    w.u32(e.id);
    writeVec(w, e.position);
    w.u16(yawToU16(e.yawRad)).u8(assertCount(e.state, 255, 'entity state'));
  }
  return w.done();
};

export const decodeSnapshot = (r: FrameReader): SnapshotMessage => {
  const tick = r.u32('tick');
  const count = assertCount(r.u16('entity count'), MAX_SNAPSHOT_ENTITIES, 'snapshot entities');
  const entities: EntityState[] = [];
  for (let k = 0; k < count; k++) {
    entities.push({
      id: r.u32('entity id'),
      position: readVec(r, 'entity position'),
      yawRad: u16ToYaw(r.u16('entity yaw')),
      state: r.u8('entity state'),
    });
  }
  return { tick, entities };
};
