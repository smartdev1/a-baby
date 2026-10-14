/**
 * Role: one client connection: handshake (protocol version + single-use ticket), then inputs forwarded to the player's current cell (updated on each cell welcome after a handoff), session messages and the cell snapshots forwarded back filtered by the player's interest set; malformed or flooding clients are disconnected.
 * Owner: backend
 */

import { randomUUID } from 'node:crypto';
import { type MessageBus, subjects, type Unsubscribe } from '@skyline/bus';
import type { Logger } from '@skyline/observability';
import {
  checkHello,
  decodeClientMessage,
  encodeServerMessage,
  ProtocolDecodeError,
  type ClientMessage,
  type ServerErrorCode,
  type ServerMessage,
} from '@skyline/protocol';
import type { TicketVerifier } from '../auth/ticket-verifier.ts';
import type { CellFanout } from '../routing/cell-fanout.ts';
import { RateLimiter } from './rate-limiter.ts';

/** What the session needs from the socket. */
export interface ClientLink {
  send(frame: Uint8Array): void;
  close(): void;
}

export interface ClientSessionDeps {
  readonly bus: MessageBus;
  readonly tickets: TicketVerifier;
  /** Cell where new players appear (J1: one spawn cell). */
  readonly spawnCell: string;
  readonly logger: Logger;
  readonly now?: () => number;
}

/** Shared by every session of one gateway. */
export interface SessionContext extends ClientSessionDeps {
  readonly fanout: CellFanout;
}

const RATE_PER_S = 60;
const BURST = 120;
const MAX_VIOLATIONS = 20;

export class ClientSession {
  readonly sessionId = randomUUID();
  private phase: 'awaiting-hello' | 'checking-ticket' | 'playing' | 'closed' = 'awaiting-hello';
  private cellKey: string | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private leaveSnapshots: (() => void) | null = null;
  private entityId: number | null = null;
  private violations = 0;
  private readonly limiter: RateLimiter;

  constructor(
    private readonly link: ClientLink,
    private readonly deps: SessionContext,
  ) {
    this.limiter = new RateLimiter(RATE_PER_S, BURST, deps.now ?? (() => Date.now()));
  }

  receive(frame: Uint8Array): void {
    if (this.phase === 'closed') return;
    if (!this.limiter.allow()) return this.violation('rate_limited', 'too many messages');
    let message: ClientMessage;
    try {
      message = decodeClientMessage(frame);
    } catch (error) {
      if (error instanceof ProtocolDecodeError) return this.violation('malformed_message', error.code);
      throw error;
    }
    this.handle(message);
  }

  /** Socket closed by the client or the network. */
  close(): void {
    if (this.phase === 'closed') return;
    this.phase = 'closed';
    this.unsubscribe?.();
    this.leaveSnapshots?.();
    if (this.cellKey) this.deps.bus.publish(subjects.sessionClosed(), { sessionId: this.sessionId });
  }

  private handle(message: ClientMessage): void {
    if (message.type === 'ping')
      return this.send({ type: 'pong', body: { clientTimeMs: message.body.clientTimeMs, serverTimeMs: Date.now() } });
    if (this.phase === 'awaiting-hello') {
      if (message.type !== 'hello') return this.violation('malformed_message', 'hello expected first');
      return void this.handshake(message.body);
    }
    if (!this.cellKey) return;
    if (message.type === 'input') this.deps.bus.publish(subjects.cellInput(this.cellKey), { sessionId: this.sessionId, input: message.body });
    else if (message.type === 'actionRequest' || message.type === 'actionCancel' || message.type === 'rideRequest')
      this.deps.bus.publish(subjects.cellAction(this.cellKey), { sessionId: this.sessionId, message });
    else if (message.type === 'chatSend' || message.type === 'chatBlock' || message.type === 'chatReport')
      this.deps.bus.publish(subjects.cellChat(this.cellKey), { sessionId: this.sessionId, message });
  }

  private async handshake(hello: Extract<ClientMessage, { type: 'hello' }>['body']): Promise<void> {
    const versionError = checkHello(hello);
    if (versionError) return this.reject(versionError.code, versionError.message);
    this.phase = 'checking-ticket';
    const valid = await Promise.resolve(this.deps.tickets.consume(hello.ticket)).catch(() => false);
    if (this.phase !== 'checking-ticket') return; // closed while the ticket was checked
    if (!valid) return this.reject('invalid_ticket', 'invalid or expired session ticket');
    this.phase = 'playing';
    this.cellKey = this.deps.spawnCell;
    this.unsubscribe = this.deps.bus.subscribe<ServerMessage>(subjects.sessionOut(this.sessionId), (m) => this.fromCell(m));
    this.followCell(this.cellKey);
    this.deps.bus.publish(subjects.cellJoin(this.cellKey), { sessionId: this.sessionId });
  }

  /** A welcome from another cell means the player was handed over: later inputs and snapshots come from that cell. */
  private fromCell(message: ServerMessage): void {
    if (message.type === 'welcome') this.entityId = message.body.playerEntityId;
    if (message.type === 'welcome' && message.body.cellKey !== this.cellKey) {
      this.cellKey = message.body.cellKey;
      this.followCell(this.cellKey);
    }
    this.send(message);
  }

  private followCell(cellKey: string): void {
    this.leaveSnapshots?.();
    this.leaveSnapshots = this.deps.fanout.join(cellKey, {
      send: (frame) => {
        if (this.phase === 'playing') this.link.send(frame);
      },
      entityId: () => this.entityId,
    });
  }

  private violation(code: ServerErrorCode, message: string): void {
    this.violations++;
    if (this.violations > MAX_VIOLATIONS || this.phase === 'awaiting-hello') this.reject(code, message);
  }

  private reject(code: ServerErrorCode, message: string): void {
    this.deps.logger.info({ sessionId: this.sessionId, code }, 'client rejected');
    this.send({ type: 'error', body: { code, message } });
    this.close();
    this.link.close();
  }

  private send(message: ServerMessage): void {
    if (this.phase !== 'closed') this.link.send(encodeServerMessage(message));
  }
}
