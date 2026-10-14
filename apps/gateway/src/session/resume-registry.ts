/**
 * Role: session resume (ARCHITECTURE §13.6): a dropped session stays alive 60 s; a single-use resume token (only its SHA-256 is kept, rotated at each handshake) lets a new connection take it over; one live connection per session, the newer one replaces the older.
 * Owner: backend
 */

import { createHash, randomBytes } from 'node:crypto';

export const RESUME_WINDOW_S = 60;

/** The live connection of a session, told when a newer one takes over. */
export interface SessionHandle {
  replaced(): void;
}

interface SessionEntry {
  cellKey: string;
  tokenHash: string | null;
  live: SessionHandle | null;
  expiry: ReturnType<typeof setTimeout> | null;
}

const hashOf = (token: string): string => createHash('sha256').update(token).digest('base64url');

export class ResumeRegistry {
  private readonly sessions = new Map<string, SessionEntry>();
  private readonly byHash = new Map<string, string>();

  constructor(private readonly windowMs = RESUME_WINDOW_S * 1000) {}

  /** A connection now plays the session: cancels a pending expiry, replaces an older connection, returns a fresh token. */
  attach(sessionId: string, cellKey: string, handle: SessionHandle): string {
    const entry = this.sessions.get(sessionId) ?? { cellKey, tokenHash: null, live: null, expiry: null };
    if (entry.expiry) clearTimeout(entry.expiry);
    const older = entry.live;
    entry.expiry = null;
    entry.live = handle;
    entry.cellKey = cellKey;
    this.sessions.set(sessionId, entry);
    if (older && older !== handle) older.replaced();
    return this.rotate(sessionId, entry);
  }

  /** The player was handed over: a resume goes to the new cell. */
  moved(sessionId: string, cellKey: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry) entry.cellKey = cellKey;
  }

  /** The connection dropped: the session survives `windowMs`, then `expire` runs (unless resumed). */
  suspend(sessionId: string, handle: SessionHandle, expire: () => void): void {
    const entry = this.sessions.get(sessionId);
    if (!entry || entry.live !== handle) return;
    entry.live = null;
    entry.expiry = setTimeout(() => {
      this.revoke(sessionId);
      expire();
    }, this.windowMs);
  }

  /** Consumes a token: the session to resume, or null (unknown, used or expired). */
  take(token: string): { sessionId: string; cellKey: string } | null {
    const hash = hashOf(token);
    const sessionId = this.byHash.get(hash);
    const entry = sessionId === undefined ? undefined : this.sessions.get(sessionId);
    if (sessionId === undefined || !entry) return null;
    this.byHash.delete(hash);
    entry.tokenHash = null;
    return { sessionId, cellKey: entry.cellKey };
  }

  /** The session ends for good (kicked, expired). */
  revoke(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;
    if (entry.expiry) clearTimeout(entry.expiry);
    if (entry.tokenHash) this.byHash.delete(entry.tokenHash);
    this.sessions.delete(sessionId);
  }

  size(): number {
    return this.sessions.size;
  }

  private rotate(sessionId: string, entry: SessionEntry): string {
    if (entry.tokenHash) this.byHash.delete(entry.tokenHash);
    const token = randomBytes(32).toString('base64url');
    entry.tokenHash = hashOf(token);
    this.byHash.set(entry.tokenHash, sessionId);
    return token;
  }
}
