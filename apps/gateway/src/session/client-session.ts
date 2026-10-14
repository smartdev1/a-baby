/**
 * Role: one client connection: handshake (protocol version + single-use ticket, or resume token of a dropped session), then inputs forwarded to the player's current cell (updated on each cell welcome after a handoff), session messages and the cell snapshots forwarded back filtered by the player's interest set; a dropped connection leaves the session alive 60 s for a resume; malformed or flooding clients are disconnected for good.
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
import { RESUME_WINDOW_S, type ResumeRegistry, type SessionHandle } from './resume-registry.ts';

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
  readonly resumes: ResumeRegistry;
}

/** Cell subject of each client request forwarded as is (daily life and transport, chat). */
const CELL_SUBJECTS: Partial<Record<ClientMessage['type'], (cellKey: string) => string>> = {
  actionRequest: subjects.cellAction,
  actionCancel: subjects.cellAction,
  rideRequest: subjects.cellAction,
  taxiRequest: subjects.cellAction,
  chatSend: subjects.cellChat,
  chatBlock: subjects.cellChat,
  chatReport: subjects.cellChat,
};

const RATE_PER_S = 60;
const BURST = 120;
const MAX_VIOLATIONS = 20;

export class ClientSession implements SessionHandle {
  private id: string = randomUUID();
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

  get sessionId(): string {
    return this.id;
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

  /** Socket closed by the client or the network: the session waits 60 s for a resume, then every cell forgets it. */
  close(): void {
    if (this.phase === 'closed') return;
    const playing = this.phase === 'playing';
    this.detach();
    if (playing) this.deps.resumes.suspend(this.id, this, () => this.deps.bus.publish(subjects.sessionClosed(), { sessionId: this.id }));
  }

  /** A newer connection resumed this session: this one stops without ending the session. */
  replaced(): void {
    if (this.phase === 'closed') return;
    this.send({ type: 'error', body: { code: 'session_replaced', message: 'this session continues on another connection' } });
    this.detach();
    this.link.close();
  }

  /** Kicked: the session ends now, with no resume. */
  private terminate(): void {
    const playing = this.phase === 'playing';
    this.detach();
    if (!playing) return;
    this.deps.resumes.revoke(this.id);
    this.deps.bus.publish(subjects.sessionClosed(), { sessionId: this.id });
  }

  private detach(): void {
    this.phase = 'closed';
    this.unsubscribe?.();
    this.leaveSnapshots?.();
  }

  private handle(message: ClientMessage): void {
    if (message.type === 'ping')
      return this.send({ type: 'pong', body: { clientTimeMs: message.body.clientTimeMs, serverTimeMs: Date.now() } });
    if (this.phase === 'awaiting-hello') {
      if (message.type !== 'hello') return this.violation('malformed_message', 'hello expected first');
      return void this.handshake(message.body);
    }
    if (!this.cellKey) return;
    if (message.type === 'input') return this.deps.bus.publish(subjects.cellInput(this.cellKey), { sessionId: this.sessionId, input: message.body });
    const subject = CELL_SUBJECTS[message.type];
    if (subject) this.deps.bus.publish(subject(this.cellKey), { sessionId: this.sessionId, message });
  }

  private async handshake(hello: Extract<ClientMessage, { type: 'hello' }>['body']): Promise<void> {
    const versionError = checkHello(hello);
    if (versionError) return this.reject(versionError.code, versionError.message);
    if (hello.resumeToken !== undefined) return this.resume(hello.resumeToken);
    this.phase = 'checking-ticket';
    const valid = await Promise.resolve(this.deps.tickets.consume(hello.ticket ?? '')).catch(() => false);
    if (this.phase !== 'checking-ticket') return; // closed while the ticket was checked
    if (!valid) return this.reject('invalid_ticket', 'invalid or expired session ticket');
    this.play(this.deps.spawnCell);
  }

  private resume(token: string): void {
    const session = this.deps.resumes.take(token);
    if (!session) return this.reject('invalid_ticket', 'invalid or expired resume token');
    this.id = session.sessionId;
    this.play(session.cellKey);
  }

  /** Joins the cell (a resumed player is still there: the cell only welcomes it again) and hands out the next resume token. */
  private play(cellKey: string): void {
    this.phase = 'playing';
    this.cellKey = cellKey;
    this.unsubscribe = this.deps.bus.subscribe<ServerMessage>(subjects.sessionOut(this.id), (m) => this.fromCell(m));
    this.followCell(cellKey);
    const resumeToken = this.deps.resumes.attach(this.id, cellKey, this);
    this.send({ type: 'resumeInfo', body: { resumeToken, windowS: RESUME_WINDOW_S } });
    this.deps.bus.publish(subjects.cellJoin(cellKey), { sessionId: this.id });
  }

  /** A welcome from another cell means the player was handed over: later inputs and snapshots come from that cell. */
  private fromCell(message: ServerMessage): void {
    if (message.type === 'welcome') this.entityId = message.body.playerEntityId;
    if (message.type === 'welcome' && message.body.cellKey !== this.cellKey) {
      this.cellKey = message.body.cellKey;
      this.deps.resumes.moved(this.id, this.cellKey);
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
    this.terminate();
    this.link.close();
  }

  private send(message: ServerMessage): void {
    if (this.phase !== 'closed') this.link.send(encodeServerMessage(message));
  }
}
