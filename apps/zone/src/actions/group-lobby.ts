/**
 * Role: joining lobbies of group actions (neighbourhood football…): players who passed the conditions wait at a place for one action; the lobby starts when full, or when its joining window ends with enough players, else it is refused.
 * Owner: backend
 */

/** Real time to gather players once the first one has joined. */
export const JOIN_WINDOW_MS = 60_000;

export interface LobbyMember {
  readonly sessionId: string;
  readonly requestId: string;
}

export interface Lobby {
  readonly key: string;
  readonly actionId: string;
  readonly placeId: string;
  readonly openedAtMs: number;
  readonly min: number;
  readonly max: number;
  readonly members: LobbyMember[];
}

export type LobbyOutcome = { readonly kind: 'start' | 'refuse'; readonly lobby: Lobby };

export class GroupLobbies {
  private readonly lobbies = new Map<string, Lobby>();

  join(input: { actionId: string; placeId: string; min: number; max: number; member: LobbyMember; nowMs: number }): Lobby {
    const key = `${input.placeId}|${input.actionId}`;
    let lobby = this.lobbies.get(key);
    if (!lobby) {
      lobby = { key, actionId: input.actionId, placeId: input.placeId, openedAtMs: input.nowMs, min: input.min, max: input.max, members: [] };
      this.lobbies.set(key, lobby);
    }
    if (!lobby.members.some((m) => m.sessionId === input.member.sessionId)) lobby.members.push(input.member);
    return lobby;
  }

  /** A player who cancels, walks away or leaves the cell. */
  leave(sessionId: string): void {
    for (const [key, lobby] of this.lobbies) {
      const i = lobby.members.findIndex((m) => m.sessionId === sessionId);
      if (i >= 0) lobby.members.splice(i, 1);
      if (lobby.members.length === 0) this.lobbies.delete(key);
    }
  }

  /** Lobbies to start (full, or window over with enough players) or to refuse (window over, too few); both are removed. */
  due(nowMs: number): LobbyOutcome[] {
    const out: LobbyOutcome[] = [];
    for (const [key, lobby] of this.lobbies) {
      const over = nowMs - lobby.openedAtMs >= JOIN_WINDOW_MS;
      if (lobby.members.length >= lobby.max || (over && lobby.members.length >= lobby.min)) out.push({ kind: 'start', lobby });
      else if (over) out.push({ kind: 'refuse', lobby });
      else continue;
      this.lobbies.delete(key);
    }
    return out;
  }
}
