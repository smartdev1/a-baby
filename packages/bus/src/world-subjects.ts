/**
 * Role: typed subjects and payloads between gateways and zone cells: players join, send inputs and leave a cell; the cell answers on the session subject.
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
export interface CellLeave {
  readonly sessionId: string;
}

export const subjects = {
  cellJoin: (cellKey: string) => `cell.${cellKey}.join`,
  cellInput: (cellKey: string) => `cell.${cellKey}.input`,
  cellLeave: (cellKey: string) => `cell.${cellKey}.leave`,
  /** Server messages for one client session, delivered by its gateway. */
  sessionOut: (sessionId: string) => `session.${sessionId}.out`,
} as const;

export type SessionOut = ServerMessage;
