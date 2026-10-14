/**
 * Role: proximity chat of one cell (ARCHITECTURE §14.2, §20.2): filtered text delivered to the players within 30 m (sender included), 1 message/s with a burst of 5, server-side blocks both ways, reports with a short excerpt kept only in memory until reported.
 * Owner: backend
 */

import type { ChatBlockMessage, ChatReportMessage, ChatSendMessage, ServerMessage } from '@skyline/protocol';
import type { ChatReportPort } from '../ports/chat-report-port.ts';
import { filterChatText } from './chat-filter.ts';
import { TokenBucket } from './token-bucket.ts';

export const CHAT_RADIUS_M = 30;
const EXCERPT_WINDOW_MS = 5 * 60_000;
const HEARD_LIMIT = 500;
const MAX_BLOCKS = 200;

/** What the chat needs from the cell. */
export interface ChatPlayers {
  entityOf(sessionId: string): number | null;
  /** Sessions within `radiusM` of the player, the player included. */
  sessionsWithin(sessionId: string, radiusM: number): readonly string[];
}

export interface ProximityChatDeps {
  readonly cellKey: string;
  readonly blockedWords: ReadonlySet<string>;
  readonly reports: ChatReportPort;
  readonly send: (sessionId: string, message: ServerMessage) => void;
  readonly now: () => number;
}

export type ChatClientMessage =
  | { readonly type: 'chatSend'; readonly body: ChatSendMessage }
  | { readonly type: 'chatBlock'; readonly body: ChatBlockMessage }
  | { readonly type: 'chatReport'; readonly body: ChatReportMessage };

interface Heard {
  readonly atMs: number;
  readonly fromEntityId: number;
  readonly text: string;
  readonly listeners: ReadonlySet<string>;
}

export class ProximityChat {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly blocks = new Map<string, Set<number>>();
  /** Recent deliveries, for report excerpts only; never persisted. */
  private readonly heard: Heard[] = [];

  constructor(
    private readonly deps: ProximityChatDeps,
    private readonly players: ChatPlayers,
  ) {}

  handle(sessionId: string, message: ChatClientMessage): Promise<void> {
    if (message.type === 'chatSend') this.say(sessionId, message.body.text);
    else if (message.type === 'chatBlock') this.block(sessionId, message.body);
    else return this.report(sessionId, message.body);
    return Promise.resolve();
  }

  /** Blocked entity ids of a player (carried across border handoffs). */
  blocksOf(sessionId: string): number[] {
    return [...(this.blocks.get(sessionId) ?? [])];
  }

  restoreBlocks(sessionId: string, entityIds: readonly number[]): void {
    if (entityIds.length > 0) this.blocks.set(sessionId, new Set(entityIds.slice(0, MAX_BLOCKS)));
  }

  remove(sessionId: string): void {
    this.buckets.delete(sessionId);
    this.blocks.delete(sessionId);
  }

  private say(sessionId: string, raw: string): void {
    const from = this.players.entityOf(sessionId);
    if (from === null) return this.deps.send(sessionId, { type: 'chatRejected', body: { reason: 'not_in_world' } });
    const now = this.deps.now();
    const bucket = this.buckets.get(sessionId) ?? new TokenBucket(1, 5, now);
    this.buckets.set(sessionId, bucket);
    if (!bucket.take(now)) return this.deps.send(sessionId, { type: 'chatRejected', body: { reason: 'rate_limited' } });
    const text = filterChatText(raw, this.deps.blockedWords);
    if (text === null) return this.deps.send(sessionId, { type: 'chatRejected', body: { reason: 'empty' } });
    const listeners = this.players.sessionsWithin(sessionId, CHAT_RADIUS_M).filter((other) => other === sessionId || !this.eitherBlocks(sessionId, from, other));
    for (const other of listeners) this.deps.send(other, { type: 'chatMessage', body: { channel: 'proximity', fromEntityId: from, text } });
    this.remember({ atMs: now, fromEntityId: from, text, listeners: new Set(listeners) });
  }

  private eitherBlocks(sessionId: string, from: number, other: string): boolean {
    const otherEntity = this.players.entityOf(other);
    return (this.blocks.get(other)?.has(from) ?? false) || (otherEntity !== null && (this.blocks.get(sessionId)?.has(otherEntity) ?? false));
  }

  private block(sessionId: string, body: ChatBlockMessage): void {
    const set = this.blocks.get(sessionId) ?? new Set<number>();
    if (body.blocked && set.size < MAX_BLOCKS) set.add(body.entityId);
    if (!body.blocked) set.delete(body.entityId);
    this.blocks.set(sessionId, set);
  }

  private async report(sessionId: string, body: ChatReportMessage): Promise<void> {
    const reporter = this.players.entityOf(sessionId);
    if (reporter === null || reporter === body.entityId) return;
    const now = this.deps.now();
    const excerpt = this.heard
      .filter((h) => h.fromEntityId === body.entityId && h.listeners.has(sessionId) && now - h.atMs <= EXCERPT_WINDOW_MS)
      .map((h) => ({ atMs: h.atMs, text: h.text }));
    await this.deps.reports.report({ cellKey: this.deps.cellKey, reporterEntityId: reporter, reportedEntityId: body.entityId, reason: body.reason, atMs: now, excerpt });
  }

  private remember(entry: Heard): void {
    this.heard.push(entry);
    const oldest = entry.atMs - EXCERPT_WINDOW_MS;
    while (this.heard.length > HEARD_LIMIT || (this.heard[0]?.atMs ?? entry.atMs) < oldest) this.heard.shift();
  }
}
