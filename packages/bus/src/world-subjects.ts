/**
 * Role: typed subjects and payloads between gateways and zone cells: players join and send inputs to a cell, cells hand players over at borders, publish one snapshot per cell and answer on the session subject; closed sessions are announced to every cell.
 * Owner: backend
 */

import type { InputMessage, ServerMessage } from '@skyline/protocol';

export interface CellJoin {
  readonly sessionId: string;
}
export interface CellInput {
  readonly sessionId: string;
  readonly input: InputMessage;
}
/** Sent to every cell: the session may be in any of them (e.g. closed during a handoff). */
export interface SessionClosed {
  readonly sessionId: string;
}

/** Published once per cell and fanned out by each gateway to its sessions in that cell. */
export type CellSnapshot = Extract<ServerMessage, { type: 'snapshot' }>;

/** A player crossing a cell border: the owning cell hands its authoritative state to the next one. */
export interface CellHandoff {
  readonly sessionId: string;
  readonly entityId: number;
  /** Absolute UTM position (frames differ between cells). */
  readonly eastingM: number;
  readonly northingM: number;
  readonly y: number;
  readonly velocity: { readonly x: number; readonly y: number; readonly z: number };
  readonly grounded: boolean;
  readonly lastSeq: number;
  readonly yawRad: number;
  /** Sender clock, to measure handoff latency (same host in the spike). */
  readonly sentAtMs: number;
}

export const subjects = {
  cellJoin: (cellKey: string) => `cell.${cellKey}.join`,
  cellInput: (cellKey: string) => `cell.${cellKey}.input`,
  cellHandoff: (cellKey: string) => `cell.${cellKey}.handoff`,
  cellSnapshot: (cellKey: string) => `cell.${cellKey}.snapshot`,
  sessionClosed: () => 'session.closed',
  /** Server messages for one client session, delivered by its gateway. */
  sessionOut: (sessionId: string) => `session.${sessionId}.out`,
} as const;

export type SessionOut = ServerMessage;
