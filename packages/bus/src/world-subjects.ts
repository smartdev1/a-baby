/**
 * Role: typed subjects and payloads between gateways and zone cells: players join and send inputs, actions and chat to a cell, cells hand players over at borders and publish border ghosts to their neighbours, publish one snapshot per cell and answer on the session subject; closed sessions are announced to every cell.
 * Owner: backend
 */

import type { ActionCancelMessage, ActionRequestMessage, RideRequestMessage, ChatBlockMessage, ChatReportMessage, ChatSendMessage, InputMessage, ServerMessage } from '@skyline/protocol';

export interface CellJoin {
  readonly sessionId: string;
}
export interface CellInput {
  readonly sessionId: string;
  readonly input: InputMessage;
}
/** A daily-life request (action or line ride) of a player, forwarded by the gateway to the player's cell. */
export interface CellAction {
  readonly sessionId: string;
  readonly message:
    | { readonly type: 'actionRequest'; readonly body: ActionRequestMessage }
    | { readonly type: 'actionCancel'; readonly body: ActionCancelMessage }
    | { readonly type: 'rideRequest'; readonly body: RideRequestMessage };
}
/** A proximity chat message, block or report of a player, forwarded by the gateway to the player's cell. */
export interface CellChat {
  readonly sessionId: string;
  readonly message:
    | { readonly type: 'chatSend'; readonly body: ChatSendMessage }
    | { readonly type: 'chatBlock'; readonly body: ChatBlockMessage }
    | { readonly type: 'chatReport'; readonly body: ChatReportMessage };
}

/** A player near a border, as a read-only ghost for a neighbour cell (absolute UTM: frames differ between cells). */
export interface GhostEntity {
  readonly id: number;
  readonly eastingM: number;
  readonly northingM: number;
  readonly y: number;
  readonly yawRad: number;
  readonly state: number;
}

/** Published at 10 Hz by a cell to each neighbour that has players of it within the ghost radius. */
export interface CellGhosts {
  readonly fromCell: string;
  readonly entities: readonly GhostEntity[];
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
  /** Needs carried to the next cell (daily life); absent when the cell runs without it. */
  readonly needs?: { readonly hunger: number; readonly energy: number; readonly hygiene: number; readonly social: number; readonly fun: number };
  /** Entity ids the player blocked in the chat. */
  readonly chatBlocked?: readonly number[];
  /** Sender clock, to measure handoff latency (same host in the spike). */
  readonly sentAtMs: number;
}

export const subjects = {
  cellJoin: (cellKey: string) => `cell.${cellKey}.join`,
  cellInput: (cellKey: string) => `cell.${cellKey}.input`,
  cellHandoff: (cellKey: string) => `cell.${cellKey}.handoff`,
  cellSnapshot: (cellKey: string) => `cell.${cellKey}.snapshot`,
  cellAction: (cellKey: string) => `cell.${cellKey}.action`,
  cellChat: (cellKey: string) => `cell.${cellKey}.chat`,
  cellGhosts: (cellKey: string) => `cell.${cellKey}.ghosts`,
  sessionClosed: () => 'session.closed',
  /** Server messages for one client session, delivered by its gateway. */
  sessionOut: (sessionId: string) => `session.${sessionId}.out`,
} as const;

export type SessionOut = ServerMessage;
