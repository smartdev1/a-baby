/**
 * Role: Zod schemas of the MessagePack control messages (hello, welcome, world_clock, error); bounded strings and numbers.
 * Owner: backend
 */

import { z } from 'zod';
import { SERVER_ERROR_CODES } from '../protocol-errors.ts';

export const HelloSchema = z
  .object({
    protocolVersion: z.number().int().min(0).max(65_535),
    /** Single-use session ticket issued by the services (60 s). */
    ticket: z.string().min(1).max(512),
    clientBuild: z.string().max(64),
  })
  .strict();

export const WelcomeSchema = z
  .object({
    protocolVersion: z.number().int(),
    playerEntityId: z.number().int().min(0).max(4_294_967_295),
    tickRateHz: z.number().int().min(1).max(120),
    /** UTM 30N origin of every position in movement messages (south-west corner of the cell). */
    frameOrigin: z.object({ eastingM: z.number().finite(), northingM: z.number().finite() }).strict(),
    cellKey: z.string().regex(/^C_\d+_\d+$/),
  })
  .strict();

/** One segment of the internal world clock (ADR 0011): game time = gameStartMin + (now − realStartMs) × ratio. */
export const WorldClockSchema = z
  .object({
    realStartMs: z.number().finite().min(0),
    gameStartMin: z.number().finite().min(0),
    /** Game minutes per real minute (default 12: one game day = 2 real hours). */
    ratio: z.number().positive().max(1_440),
    paused: z.boolean(),
  })
  .strict();

export const ServerErrorSchema = z.object({ code: z.enum(SERVER_ERROR_CODES), message: z.string().max(200) }).strict();

export type HelloMessage = z.infer<typeof HelloSchema>;
export type WelcomeMessage = z.infer<typeof WelcomeSchema>;
export type WorldClockMessage = z.infer<typeof WorldClockSchema>;
export type ServerErrorMessage = z.infer<typeof ServerErrorSchema>;
