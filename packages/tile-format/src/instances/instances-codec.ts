/**
 * Role: encodes and decodes instances.bin v1 (instanced modules of one tile: module index, local position, yaw, scale, variant) with bounded, typed decoding.
 * Owner: backend
 *
 * Layout (little-endian): magic "SKYI" | u16 version | u16 flags (0) | u32 count |
 *   count × (u16 module | f32 x | f32 y | f32 z | u16 yaw (turn fraction) | u8 scale (0.5 + q / 170) | u8 variant)
 * Positions are metres local to the tile south-west corner (x = east, y = up, z = north).
 */

import { BoundedReader, CollisionDecodeError } from '../collision/bounded-reader.ts';
import { GrowableWriter } from '../collision/growable-writer.ts';
import { INSTANCE_MODULES } from './instance-catalogue.ts';

export const INSTANCES_MAGIC = 'SKYI';
export const INSTANCES_VERSION = 1;
export const MAX_INSTANCES_PER_TILE = 200_000;

export interface Instance {
  readonly module: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yawRad: number;
  /** 0.5 … 2.0 (quantized to 1/170). */
  readonly scale: number;
  /** Tint / dirt variation picked by the client (0 … 255). */
  readonly variant: number;
}

const TAU = Math.PI * 2;
const quantizeYaw = (rad: number): number => Math.round(((((rad % TAU) + TAU) % TAU) / TAU) * 65_536) % 65_536;
const quantizeScale = (scale: number): number => Math.max(0, Math.min(255, Math.round((scale - 0.5) * 170)));

export const encodeInstances = (instances: readonly Instance[]): Uint8Array => {
  if (instances.length > MAX_INSTANCES_PER_TILE) throw new RangeError(`${instances.length} instances > ${MAX_INSTANCES_PER_TILE}`);
  const out = new GrowableWriter();
  out.ascii(INSTANCES_MAGIC);
  out.u16(INSTANCES_VERSION);
  out.u16(0);
  out.u32(instances.length);
  for (const i of instances) {
    if (!Number.isInteger(i.module) || i.module < 0 || i.module >= INSTANCE_MODULES.length) throw new RangeError(`unknown module ${i.module}`);
    out.u16(i.module);
    out.f32(i.x);
    out.f32(i.y);
    out.f32(i.z);
    out.u16(quantizeYaw(i.yawRad));
    out.u8(quantizeScale(i.scale));
    out.u8(Math.max(0, Math.min(255, Math.round(i.variant))));
  }
  return out.toBytes();
};

export const decodeInstances = (bytes: Uint8Array): Instance[] => {
  const r = new BoundedReader(bytes);
  if (r.ascii(4, 'magic') !== INSTANCES_MAGIC) throw new CollisionDecodeError('bad-magic', 'not a SkyLine instances file');
  const version = r.u16('version');
  if (version !== INSTANCES_VERSION) throw new CollisionDecodeError('unsupported-version', `instances version ${version}`);
  r.u16('flags');
  const count = r.u32('count');
  if (count > MAX_INSTANCES_PER_TILE) throw new CollisionDecodeError('out-of-range', `instance count ${count}`);
  const instances: Instance[] = [];
  for (let k = 0; k < count; k++) {
    const module = r.u16('module');
    if (module >= INSTANCE_MODULES.length) throw new CollisionDecodeError('out-of-range', `unknown module ${module}`);
    instances.push({ module, x: r.f32('x'), y: r.f32('y'), z: r.f32('z'), yawRad: (r.u16('yaw') / 65_536) * TAU, scale: 0.5 + r.u8('scale') / 170, variant: r.u8('variant') });
  }
  if (r.remaining !== 0) throw new CollisionDecodeError('trailing-bytes', `${r.remaining} unexpected bytes`);
  return instances;
};
