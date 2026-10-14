/**
 * Role: Zod schemas of the MessagePack control messages (hello, welcome, world_clock, error, resume info); bounded strings and numbers.
 * Owner: backend
 */

import { z } from 'zod';
import { SERVER_ERROR_CODES } from '../protocol-errors.ts';

export const HelloSchema = z
  .object({
    protocolVersion: z.number().int().min(0).max(65_535),
    /** Single-use session ticket issued by the services (60 s), for a new session. */
    ticket: z.string().min(1).max(512).optional(),
    /** Resume token of a dropped session (60 s), instead of a ticket (ARCHITECTURE §13.6). */
    resumeToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional(),
    clientBuild: z.string().max(64),
  })
  .strict()
  .refine((h) => (h.ticket === undefined) !== (h.resumeToken === undefined), 'exactly one of ticket and resumeToken');

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

/** Sent after each successful handshake: the token to resume this session after a drop; a new one each time. */
export const ResumeInfoSchema = z.object({ resumeToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/), windowS: z.number().int().min(1).max(600) }).strict();

export const ServerErrorSchema = z.object({ code: z.enum(SERVER_ERROR_CODES), message: z.string().max(200) }).strict();

export type HelloMessage = z.infer<typeof HelloSchema>;
export type WelcomeMessage = z.infer<typeof WelcomeSchema>;
export type WorldClockMessage = z.infer<typeof WorldClockSchema>;
export type ServerErrorMessage = z.infer<typeof ServerErrorSchema>;
export type ResumeInfoMessage = z.infer<typeof ResumeInfoSchema>;
