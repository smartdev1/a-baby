/**
 * Role: MessagePack encoding of control messages with hard decode limits (string, array, map, depth) and Zod validation of the result.
 * Owner: backend
 */

import { decode, encode } from '@msgpack/msgpack';
import { z } from 'zod';
import { ProtocolDecodeError } from '../protocol-errors.ts';

const DECODE_LIMITS = {
  maxStrLength: 1024,
  maxBinLength: 0,
  maxArrayLength: 64,
  maxMapLength: 16,
  maxExtLength: 0,
  maxDepth: 4,
} as const;

export const encodeControl = (type: number, payload: unknown): Uint8Array => {
  const body = encode(payload);
  const frame = new Uint8Array(1 + body.byteLength);
  frame[0] = type;
  frame.set(body, 1);
  return frame;
};

export const decodeControl = <T>(body: Uint8Array, schema: z.ZodType<T>, what: string): T => {
  let raw: unknown;
  try {
    raw = decode(body, DECODE_LIMITS);
  } catch (error) {
    throw new ProtocolDecodeError('invalid-payload', `${what}: ${(error as Error).message}`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ProtocolDecodeError('invalid-payload', `${what}: ${z.prettifyError(result.error)}`);
  return result.data;
};
