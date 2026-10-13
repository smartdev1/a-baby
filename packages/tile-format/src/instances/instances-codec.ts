/**
 * Role: encodes and decodes instances.bin v2 (instanced modules of one tile: module index, local position, yaw, uniform scale, variant, width/height stretch) with bounded, typed decoding; v1 files still decode.
 * Owner: backend
 *
 * Layout (little-endian): magic "SKYI" | u16 version | u16 flags (0) | u32 count |
 *   count × (u16 module | f32 x | f32 y | f32 z | u16 yaw (turn fraction) | u8 scale | u8 variant | u8 stretchX | u8 stretchY)   — v1 has no stretch bytes.
 * Scales are quantized as 0.5 + q / 170 (0.5 … 2.0). Positions are metres local to the tile south-west corner (x = east, y = up, z = north).
 * Module frame: x along the module width, y up, z = the side it faces; yaw 0 faces north (+z), positive towards east.
 */

import { BoundedReader, CollisionDecodeError } from '../collision/bounded-reader.ts';
import { GrowableWriter } from '../collision/growable-writer.ts';
import { INSTANCE_MODULES } from './instance-catalogue.ts';

export const INSTANCES_MAGIC = 'SKYI';
export const INSTANCES_VERSION = 2;
export const MAX_INSTANCES_PER_TILE = 200_000;

export interface Instance {
  readonly module: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yawRad: number;
  /** Uniform scale 0.5 … 2.0 (quantized to 1/170). */
  readonly scale: number;
  /** Props and vegetation: free variant index. Facade modules: bits 0–3 tint, bits 4–7 dirt level (0 … 15). */
  readonly variant: number;
  /** Extra scale along the module width (x) and height (y), 0.5 … 2.0; 1 when absent (facade bays stretched to the wall). */
  readonly stretchX?: number;
  readonly stretchY?: number;
}

const TAU = Math.PI * 2;
const quantizeYaw = (rad: number): number => Math.round(((((rad % TAU) + TAU) % TAU) / TAU) * 65_536) % 65_536;
const quantizeScale = (scale: number): number => Math.max(0, Math.min(255, Math.round((scale - 0.5) * 170)));
const unquantizeScale = (q: number): number => 0.5 + q / 170;

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
    out.u8(quantizeScale(i.stretchX ?? 1));
    out.u8(quantizeScale(i.stretchY ?? 1));
  }
  return out.toBytes();
};

const readInstance = (r: BoundedReader, version: number): Instance => {
  const module = r.u16('module');
  if (module >= INSTANCE_MODULES.length) throw new CollisionDecodeError('out-of-range', `unknown module ${module}`);
  const base = { module, x: r.f32('x'), y: r.f32('y'), z: r.f32('z'), yawRad: (r.u16('yaw') / 65_536) * TAU, scale: unquantizeScale(r.u8('scale')), variant: r.u8('variant') };
  if (version === 1) return { ...base, stretchX: 1, stretchY: 1 };
  return { ...base, stretchX: unquantizeScale(r.u8('stretchX')), stretchY: unquantizeScale(r.u8('stretchY')) };
};

export const decodeInstances = (bytes: Uint8Array): Instance[] => {
  const r = new BoundedReader(bytes);
  if (r.ascii(4, 'magic') !== INSTANCES_MAGIC) throw new CollisionDecodeError('bad-magic', 'not a SkyLine instances file');
  const version = r.u16('version');
  if (version !== 1 && version !== INSTANCES_VERSION) throw new CollisionDecodeError('unsupported-version', `instances version ${version}`);
  r.u16('flags');
  const count = r.u32('count');
  if (count > MAX_INSTANCES_PER_TILE) throw new CollisionDecodeError('out-of-range', `instance count ${count}`);
  const instances: Instance[] = [];
  for (let k = 0; k < count; k++) instances.push(readInstance(r, version));
  if (r.remaining !== 0) throw new CollisionDecodeError('trailing-bytes', `${r.remaining} unexpected bytes`);
  return instances;
};
