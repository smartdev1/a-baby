/**
 * Role: encodes and decodes collision.bin v0 (2.5D collision of one tile: height field + obstacle prisms), shared by client prediction and the zone server.
 * Owner: backend
 *
 * Layout (little-endian):
 *   magic "SKYC" | u16 version | u16 flags (0)
 *   height field: u16 resolution N (samples per side) | f32 cellSizeM | N×N f32 heights (row-major, south → north, west → east)
 *   prisms: u32 count | per prism: f32 baseYM | f32 topYM | u16 vertexCount | vertexCount × (f32 x, f32 z)
 * Coordinates are metres local to the tile south-west corner (x = east, z = north).
 */

import { BoundedReader, CollisionDecodeError } from './bounded-reader.ts';
import { GrowableWriter } from './growable-writer.ts';

export const COLLISION_MAGIC = 'SKYC';
export const COLLISION_VERSION = 0;

/** Hard limits that bound memory when decoding untrusted files. */
export const COLLISION_LIMITS = { maxResolution: 1025, maxPrisms: 65_535, maxVerticesPerPrism: 4_096 } as const;

export interface HeightField {
  readonly resolution: number;
  readonly cellSizeM: number;
  /** resolution × resolution heights in metres. */
  readonly heightsM: Float32Array;
}

export interface Prism {
  readonly baseYM: number;
  readonly topYM: number;
  /** Closed ring without repeated last vertex: [x0, z0, x1, z1, …]. */
  readonly ring: Float32Array;
}

export interface CollisionData {
  readonly heightField: HeightField;
  readonly prisms: readonly Prism[];
}

const invalid = (message: string): never => {
  throw new CollisionDecodeError('invalid-value', message);
};

const checkCount = (value: number, max: number, what: string, min = 0): number => {
  if (value < min || value > max)
    throw new CollisionDecodeError('out-of-range', `${what} = ${value} (allowed ${min}..${max})`);
  return value;
};

export const encodeCollision = ({ heightField, prisms }: CollisionData): Uint8Array => {
  const { resolution, cellSizeM, heightsM } = heightField;
  if (heightsM.length !== resolution * resolution)
    invalid(`height field has ${heightsM.length} samples, expected ${resolution ** 2}`);
  checkCount(resolution, COLLISION_LIMITS.maxResolution, 'resolution', 2);
  checkCount(prisms.length, COLLISION_LIMITS.maxPrisms, 'prism count');

  const out = new GrowableWriter();
  out.ascii(COLLISION_MAGIC);
  out.u16(COLLISION_VERSION);
  out.u16(0);
  out.u16(resolution);
  out.f32(cellSizeM);
  out.f32Array(heightsM);
  out.u32(prisms.length);
  for (const prism of prisms) {
    const vertexCount = prism.ring.length / 2;
    if (!Number.isInteger(vertexCount)) invalid('prism ring must hold x,z pairs');
    checkCount(vertexCount, COLLISION_LIMITS.maxVerticesPerPrism, 'prism vertex count', 3);
    if (prism.topYM < prism.baseYM) invalid('prism top is below its base');
    out.f32(prism.baseYM);
    out.f32(prism.topYM);
    out.u16(vertexCount);
    out.f32Array(prism.ring);
  }
  return out.toBytes();
};

const decodeHeader = (reader: BoundedReader): void => {
  if (reader.ascii(4, 'magic') !== COLLISION_MAGIC)
    throw new CollisionDecodeError('bad-magic', 'not a SkyLine collision file');
  const version = reader.u16('version');
  if (version !== COLLISION_VERSION)
    throw new CollisionDecodeError('unsupported-version', `version ${version}, expected ${COLLISION_VERSION}`);
  reader.u16('flags');
};

const decodeHeightField = (reader: BoundedReader): HeightField => {
  const resolution = checkCount(reader.u16('resolution'), COLLISION_LIMITS.maxResolution, 'resolution', 2);
  const cellSizeM = reader.f32('cellSizeM');
  if (cellSizeM <= 0) invalid('cellSizeM must be positive');
  return { resolution, cellSizeM, heightsM: reader.f32Array(resolution * resolution, 'heights') };
};

const decodePrism = (reader: BoundedReader, index: number): Prism => {
  const baseYM = reader.f32(`prism[${index}].baseYM`);
  const topYM = reader.f32(`prism[${index}].topYM`);
  if (topYM < baseYM) invalid(`prism[${index}] top is below its base`);
  const vertexCount = checkCount(
    reader.u16(`prism[${index}].vertexCount`),
    COLLISION_LIMITS.maxVerticesPerPrism,
    'prism vertex count',
    3,
  );
  return { baseYM, topYM, ring: reader.f32Array(vertexCount * 2, `prism[${index}].ring`) };
};

export const decodeCollision = (bytes: Uint8Array): CollisionData => {
  const reader = new BoundedReader(bytes);
  decodeHeader(reader);
  const heightField = decodeHeightField(reader);
  const count = checkCount(reader.u32('prism count'), COLLISION_LIMITS.maxPrisms, 'prism count');
  const prisms: Prism[] = [];
  for (let k = 0; k < count; k++) prisms.push(decodePrism(reader, k));
  if (reader.remaining !== 0)
    throw new CollisionDecodeError('trailing-bytes', `${reader.remaining} unexpected bytes at the end`);
  return { heightField, prisms };
};
