/**
 * Role: quantization of positions (mm, i32), yaw (u16 turn fraction), move axes (i8) and velocities (cm/s, i16), with range checks.
 * Owner: backend
 */

import { ProtocolDecodeError } from '../protocol-errors.ts';

const TAU = Math.PI * 2;

const checkInt = (value: number, min: number, max: number, what: string): number => {
  if (!Number.isInteger(value) || value < min || value > max) throw new ProtocolDecodeError('out-of-range', `${what} = ${value} outside ${min}..${max}`);
  return value;
};

/** Metres ↔ integer millimetres (±2 147 km around the frame origin). */
export const metresToMm = (m: number): number => checkInt(Math.round(m * 1000), -2_147_483_648, 2_147_483_647, 'position');
export const mmToMetres = (mm: number): number => mm / 1000;

/** Radians ↔ u16 fraction of a turn (resolution ≈ 0.0055°). */
export const yawToU16 = (rad: number): number => Math.round(((((rad % TAU) + TAU) % TAU) / TAU) * 65_536) % 65_536;
export const u16ToYaw = (q: number): number => (q / 65_536) * TAU;

/** Move axis in [-1, 1] ↔ i8 in [-127, 127]. */
export const axisToI8 = (v: number): number => Math.round(Math.max(-1, Math.min(1, v)) * 127);
export const i8ToAxis = (q: number): number => checkInt(q, -127, 127, 'move axis') / 127;

/** Metres per second ↔ centimetres per second in i16 (±327 m/s). */
export const speedToCm = (mPerS: number): number => checkInt(Math.round(mPerS * 100), -32_768, 32_767, 'velocity');
export const cmToSpeed = (cm: number): number => cm / 100;

export const assertCount = (count: number, max: number, what: string): number => checkInt(count, 0, max, what);
