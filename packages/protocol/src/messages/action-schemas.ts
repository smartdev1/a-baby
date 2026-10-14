/**
 * Role: Zod schemas of the daily-life control messages (protocol v2): action request and cancel from the client; action, needs and wallet updates from the server. Bounded strings, arrays and numbers.
 * Owner: backend
 */

import { z } from 'zod';

/** Client-made UUID used as idempotency key (`action:{requestId}`). */
const RequestIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);
const ContentIdSchema = z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/).max(64);

export const ActionRequestSchema = z
  .object({
    requestId: RequestIdSchema,
    actionId: ContentIdSchema,
    /** OSM place id from the tile meta (`osm:node/123`). */
    placeId: z.string().regex(/^osm:(node|way|relation)\/\d+$/).max(40),
  })
  .strict();

export const ActionCancelSchema = z.object({ requestId: RequestIdSchema }).strict();

export const ACTION_UPDATE_STATES = ['rejected', 'accepted', 'running', 'completed', 'interrupted', 'failed'] as const;

export const ActionUpdateSchema = z
  .object({
    requestId: RequestIdSchema,
    actionId: ContentIdSchema,
    state: z.enum(ACTION_UPDATE_STATES),
    /** 0–1, real-time share of the action (ellipse). */
    progress: z.number().min(0).max(1),
    /** Why the request was refused or interrupted: codes and parameters for i18n messages. */
    refusals: z
      .array(z.object({ code: z.string().regex(/^[a-z_]{1,40}$/), params: z.record(z.string().max(40), z.union([z.string().max(120), z.number()])).optional() }).strict())
      .max(16),
  })
  .strict();

const NeedValue = z.number().min(0).max(100);
export const NeedsUpdateSchema = z.object({ values: z.object({ hunger: NeedValue, energy: NeedValue, hygiene: NeedValue, social: NeedValue, fun: NeedValue }).strict() }).strict();

export const WalletUpdateSchema = z
  .object({
    /** Confirmed balance (the client never credits or debits ahead). */
    djai: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    txId: z.string().max(64).nullable(),
  })
  .strict();

export type ActionRequestMessage = z.infer<typeof ActionRequestSchema>;
export type ActionCancelMessage = z.infer<typeof ActionCancelSchema>;
export type ActionUpdateMessage = z.infer<typeof ActionUpdateSchema>;
export type NeedsUpdateMessage = z.infer<typeof NeedsUpdateSchema>;
export type WalletUpdateMessage = z.infer<typeof WalletUpdateSchema>;
