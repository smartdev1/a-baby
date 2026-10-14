/**
 * Role: Zod schemas of the proximity chat messages (protocol v3, ARCHITECTURE §14.2 and §20.2): send, block and report from the client; filtered message and refusal from the server. Proximity channel only, text ≤ 200 characters.
 * Owner: backend
 */

import { z } from 'zod';

export const CHAT_MAX_CHARS = 200;
const EntityIdSchema = z.number().int().min(0).max(0xffff_ffff);

export const ChatSendSchema = z
  .object({
    /** Only `proximity` at the MVP; `private` and `group` are extension points (§25). */
    channel: z.literal('proximity'),
    text: z.string().min(1).max(CHAT_MAX_CHARS),
  })
  .strict();

/** Server-side block: neither player receives the other's messages any more. */
export const ChatBlockSchema = z.object({ entityId: EntityIdSchema, blocked: z.boolean() }).strict();

export const CHAT_REPORT_REASONS = ['insult', 'harassment', 'scam', 'sexual', 'spam', 'other'] as const;
export const ChatReportSchema = z.object({ entityId: EntityIdSchema, reason: z.enum(CHAT_REPORT_REASONS) }).strict();

export const ChatMessageSchema = z
  .object({
    channel: z.literal('proximity'),
    fromEntityId: EntityIdSchema,
    /** Already filtered: blocked words, phone numbers and links are masked. */
    text: z.string().min(1).max(CHAT_MAX_CHARS),
  })
  .strict();

export const CHAT_REJECTIONS = ['rate_limited', 'empty', 'not_in_world'] as const;
export const ChatRejectedSchema = z.object({ reason: z.enum(CHAT_REJECTIONS) }).strict();

export type ChatSendMessage = z.infer<typeof ChatSendSchema>;
export type ChatBlockMessage = z.infer<typeof ChatBlockSchema>;
export type ChatReportMessage = z.infer<typeof ChatReportSchema>;
export type ChatReportReason = (typeof CHAT_REPORT_REASONS)[number];
export type ChatMessageBody = z.infer<typeof ChatMessageSchema>;
export type ChatRejectedMessage = z.infer<typeof ChatRejectedSchema>;
