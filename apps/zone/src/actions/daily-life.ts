/**
 * Role: daily life of a cell (J3-05): binds the action engine to the world — validates requests against the player's state and the cell's places, reserves sites, runs actions at 1 Hz with the ellipse, decays needs in game time, settles through the EconomyPort and tells the player.
 * Owner: backend
 */

import type { Action } from '@skyline/content-schema';
import { characterAccount, type EconomyPort, legsFromTransfers } from '@skyline/economy-rules';
import type { ActionCancelMessage, ActionRequestMessage, ActionUpdateMessage, ServerMessage } from '@skyline/protocol';
import { type ActorView, interruptRun, inWindows, type PlaceView, requestRun, reserveRun, startRun, tickRun } from '@skyline/sim-actions';
import { advanceNeeds, applyNeedDeltas, initialNeeds, type NeedValues } from '@skyline/sim-needs';
import { grantStarterMoney } from '../adapters/in-memory-economy.ts';
import type { CellPlace, CellSite } from '../world-data/cell-places-loader.ts';
import type { DailyLifeContent } from './daily-life-content.ts';
import { PlayerLife, type RunningAction } from './player-life.ts';
import { SiteReservations } from './site-reservations.ts';

export interface DailyLifeDeps {
  readonly content: DailyLifeContent;
  readonly places: ReadonlyMap<string, CellPlace>;
  readonly economy: EconomyPort;
  /** Absolute game minute now (sim-clock segment of the world clock). */
  readonly gameMinute: () => number;
  readonly clockRatio: () => number;
  readonly send: (sessionId: string, message: ServerMessage) => void;
  readonly starterDjai: number;
  /** Real clock in ms (injected by tests); default Date.now. */
  readonly realNow?: () => number;
}

export interface PlayerPositions {
  /** Player position in the cell frame. */
  positionOf(sessionId: string): { readonly x: number; readonly z: number } | null;
  /** Other players within `radiusM`. */
  nearby(sessionId: string, radiusM: number): number;
}

const SOCIAL_RADIUS_M = 5;
/** Leaving the site by more than this beyond its radius interrupts the action. */
const WALK_AWAY_MARGIN_M = 1.5;

const distance = (a: { x: number; z: number } | null, b: { x: number; z: number }): number => (a ? Math.hypot(a.x - b.x, a.z - b.z) : Number.POSITIVE_INFINITY);

export class DailyLife {
  private readonly players = new Map<string, PlayerLife>();
  private readonly reservations = new SiteReservations();

  constructor(
    private readonly deps: DailyLifeDeps,
    private readonly world: PlayerPositions,
  ) {}

  /** `carried`: needs brought from the previous cell (handoff); fresh needs otherwise. */
  async addPlayer(sessionId: string, carried?: NeedValues, characterId = sessionId): Promise<void> {
    const now = this.deps.gameMinute();
    const life = new PlayerLife(sessionId, characterId, carried ? { values: carried, atGameMinute: now } : initialNeeds(this.deps.content.needs, now));
    this.players.set(sessionId, life);
    await grantStarterMoney(this.deps.economy, characterId, this.deps.starterDjai);
    await this.sendWallet(life, null);
    this.sendNeeds(life, true);
  }

  /** Disconnection or handoff: the running action is interrupted and settled, the site released. */
  async removePlayer(sessionId: string, reason: string): Promise<void> {
    const life = this.players.get(sessionId);
    if (!life) return;
    await life.serial(async () => {
      if (life.running && life.running.run.state === 'running') await this.finish(life, life.running, interruptRun(life.running.run, reason));
    });
    this.players.delete(sessionId);
  }

  handle(sessionId: string, message: { type: 'actionRequest'; body: ActionRequestMessage } | { type: 'actionCancel'; body: ActionCancelMessage }): Promise<void> {
    const life = this.players.get(sessionId);
    if (!life) return Promise.resolve();
    return life.serial(async () => {
      if (message.type === 'actionRequest') this.request(life, message.body);
      else await this.cancel(life, message.body.requestId);
    });
  }

  /** 1 Hz: needs decay, actions progress, walk-away interruptions and settlements. */
  async tick(nowRealMs: number): Promise<void> {
    await Promise.all([...this.players.values()].map((life) => life.serial(() => this.tickPlayer(life, nowRealMs))));
  }

  needsOf(sessionId: string): PlayerLife['needs'] | null {
    return this.players.get(sessionId)?.needs ?? null;
  }

  private actorView(life: PlayerLife): ActorView {
    life.needs = advanceNeeds(life.needs, this.deps.gameMinute(), this.deps.content.needs);
    return {
      characterId: life.characterId,
      needs: life.needs.values,
      djai: life.djai,
      states: new Set(life.running ? ['on_foot'] : ['on_foot', 'not_in_action']),
      gameMinute: this.deps.gameMinute(),
      cooldowns: life.cooldowns,
      nearbyCharacters: this.world.nearby(life.sessionId, SOCIAL_RADIUS_M),
    };
  }

  private request(life: PlayerLife, body: ActionRequestMessage): void {
    const known = life.updates.get(body.requestId);
    if (known) return this.sendUpdate(life, known);
    const action = this.deps.content.actions.get(body.actionId);
    const place = this.deps.places.get(body.placeId);
    const reject = (code: string): void => this.sendUpdate(life, { requestId: body.requestId, actionId: body.actionId, state: 'rejected', progress: 0, refusals: [{ code }] });
    if (!action) return reject('unknown_action');
    if (!place) return reject('unknown_place');
    if (life.running) return reject('busy');
    const { site, placeView } = this.placeViewFor(life, action, place);
    let run = requestRun({ requestId: body.requestId, action, actor: this.actorView(life), place: placeView });
    if (run.state === 'rejected' || !site) {
      return this.sendUpdate(life, { requestId: run.requestId, actionId: action.id, state: 'rejected', progress: 0, refusals: run.refusals.map((r) => ({ code: r.code, ...(r.params ? { params: r.params } : {}) })) });
    }
    run = reserveRun(run, this.reservations.reserve(life.scoped(run.requestId), place.id, site.kind, site.capacity));
    if (run.state === 'rejected') return reject('no_free_site');
    life.running = { run: startRun(run, (this.deps.realNow ?? Date.now)()), action, place, site };
    this.sendUpdate(life, { requestId: run.requestId, actionId: action.id, state: 'running', progress: 0, refusals: [] });
  }

  /** The site of the action at this place (if any) and what the engine needs to know about the place. */
  private placeViewFor(life: PlayerLife, action: Action, place: CellPlace): { site: CellSite | undefined; placeView: PlaceView } {
    const site = place.sites.find((s) => s.kind === action.where.site);
    const type = this.deps.content.placeTypes.get(place.placeType);
    const openingHours = type?.openingHours ?? [];
    const placeView: PlaceView = {
      placeId: place.id,
      placeType: place.placeType,
      openingHours,
      // NPC staff are deterministic: the place type's roles work during its opening hours (the client shows the same NPCs).
      npcRolesOnDuty: inWindows(openingHours, this.deps.gameMinute()) ? (type?.npcRoles ?? []) : [],
      distanceToSiteM: site ? distance(this.world.positionOf(life.sessionId), site) : Number.POSITIVE_INFINITY,
      freeSites: site ? this.reservations.free(place.id, site.kind, site.capacity) : 0,
    };
    return { site, placeView };
  }

  private async cancel(life: PlayerLife, requestId: string): Promise<void> {
    const running = life.running;
    if (!running || running.run.requestId !== requestId || running.run.state !== 'running' || !running.action.duration.interruptible) return;
    await this.finish(life, running, interruptRun(running.run, 'cancelled'));
  }

  private async tickPlayer(life: PlayerLife, nowRealMs: number): Promise<void> {
    life.needs = advanceNeeds(life.needs, this.deps.gameMinute(), this.deps.content.needs);
    const running = life.running;
    if (running && running.run.state === 'running') {
      if (distance(this.world.positionOf(life.sessionId), running.site) > running.action.where.interactionRadiusM + WALK_AWAY_MARGIN_M) {
        await this.finish(life, running, interruptRun(running.run, 'walked_away'));
      } else {
        const step = tickRun(running.run, running.action, this.deps.clockRatio(), nowRealMs);
        life.needs = applyNeedDeltas(life.needs, step.needDeltas);
        running.run = step.run;
        if (step.run.state === 'completed') await this.finish(life, running, step.run);
        else this.sendUpdate(life, { requestId: step.run.requestId, actionId: running.action.id, state: 'running', progress: Math.round(step.run.progress * 1000) / 1000, refusals: [] });
      }
    }
    this.sendNeeds(life, false);
  }

  /** Settles an ended run once, commits its legs, applies its effects and frees the site. */
  private async finish(life: PlayerLife, running: RunningAction, ended: RunningAction['run']): Promise<void> {
    life.running = null;
    this.reservations.release(life.scoped(ended.requestId));
    const ctx = { actorAccount: characterAccount(life.characterId), providerAccount: `place:${running.place.id}`, actionId: running.action.id, nearbyCharacters: this.world.nearby(life.sessionId, SOCIAL_RADIUS_M) };
    const settlement = life.settlements.settleOnce({ run: ended, action: running.action, ctx, gameMinute: this.deps.gameMinute() });
    const legs = legsFromTransfers(settlement.batch.legs);
    let txId: string | null = null;
    if (legs.length > 0) {
      const result = await this.deps.economy.commit({ idempotencyKey: `action:${life.scoped(ended.requestId)}`, kind: legs.some((l) => l.account === 'system:wages') ? 'wage' : 'purchase', legs, reason: { actionId: running.action.id, placeId: running.place.id, requestId: ended.requestId } });
      if (!result.ok) {
        return this.sendUpdate(life, { requestId: ended.requestId, actionId: running.action.id, state: 'failed', progress: ended.progress, refusals: [{ code: result.code.toLowerCase() }] });
      }
      txId = result.txId;
    }
    life.needs = applyNeedDeltas(life.needs, settlement.batch.needDeltas);
    if (settlement.cooldown) life.cooldowns.set(settlement.cooldown.scope === 'character' ? running.action.id : `${running.action.id}@${running.place.id}`, settlement.cooldown.untilGameMinute);
    for (const b of settlement.batch.buffs) life.buffs.set(b.buff, this.deps.gameMinute() + b.gameMinutes);
    const state = settlement.endedAs === 'completed' ? 'completed' : settlement.endedAs;
    this.sendUpdate(life, { requestId: ended.requestId, actionId: running.action.id, state, progress: state === 'completed' ? 1 : ended.progress, refusals: ended.reason ? [{ code: ended.reason }] : [] });
    if (txId) await this.sendWallet(life, txId);
    this.sendNeeds(life, true);
  }

  private sendUpdate(life: PlayerLife, update: ActionUpdateMessage): void {
    if (update.state !== 'running') life.remember(update);
    this.deps.send(life.sessionId, { type: 'actionUpdate', body: update });
  }

  private sendNeeds(life: PlayerLife, force: boolean): void {
    const v = life.needs.values;
    const values = { hunger: v.hunger, energy: v.energy, hygiene: v.hygiene, social: v.social, fun: v.fun };
    const key = JSON.stringify(Object.values(values).map((n) => Math.round(n * 10)));
    if (!force && key === life.lastNeedsSent) return;
    life.lastNeedsSent = key;
    this.deps.send(life.sessionId, { type: 'needsUpdate', body: { values } });
  }

  private async sendWallet(life: PlayerLife, txId: string | null): Promise<void> {
    life.djai = Number(await this.deps.economy.balanceOf(characterAccount(life.characterId)));
    this.deps.send(life.sessionId, { type: 'walletUpdate', body: { djai: life.djai, txId } });
  }
}
