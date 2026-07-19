import type { CharacterStats } from '../types/character.js';
import type {
  BattleState,
  PlayerInput,
  ShopSkill,
} from '../types/battle.js';
import type {
  GameServerEndpoint,
  GameSessionConfig,
  GameSessionEvent,
  GameSessionStatus,
  SkillRequest,
} from '../types/game-server.js';
import { ROUND_BONUS_STAT_POINTS } from '../constants/battle.js';
import {
  computeMaxHp,
  computeMaxMana,
  createBattleFromLobby,
  startCombatPhase,
  startNextRound,
} from './battle-init.js';
import { allPlayersReady, tickBattle } from './battle-sim.js';
import { mergeCharacterStats, randomStatBudget } from './character.js';
import {
  mergeGearStatBonuses,
  purchaseGear as purchaseGearLogic,
  sortEquippedGear,
  sortGearKinds,
} from './gear-shop.js';
import { purchaseSkill as purchaseSkillLogic } from './shop.js';

const DEFAULT_INPUT = (): PlayerInput => ({
  moveX: 0,
  moveZ: 0,
  jump: false,
  skillIndex: null,
  aimX: 0,
  aimZ: 1,
});

function tryStartCombat(state: BattleState): BattleState {
  if (!allPlayersReady(state)) return state;
  return startCombatPhase(state);
}

function applyGearToEntity(
  entity: BattleState['entities'][number],
  baseStats: CharacterStats,
  bonusStats: CharacterStats,
  equippedGear: BattleState['players'][number]['equippedGear'],
): BattleState['entities'][number] {
  const gearStats = mergeGearStatBonuses(equippedGear);
  const combatStats = mergeCharacterStats(baseStats, bonusStats, gearStats);
  const equippedGearSorted = sortEquippedGear(equippedGear);
  const equippedKinds = sortGearKinds(equippedGearSorted.map((gear) => gear.kind));
  const maxHp = computeMaxHp('player', combatStats);
  const maxMana = computeMaxMana(combatStats);

  return {
    ...entity,
    equippedGearKinds: equippedKinds,
    equippedGear: equippedGearSorted,
    characterStats: combatStats,
    maxHp,
    maxMana,
    hp: maxHp,
    mana: maxMana,
  };
}

export class GameSession {
  readonly id: string;
  readonly endpoint: GameServerEndpoint;

  private state: BattleState;
  private inputs: Record<string, PlayerInput> = {};
  private skillQueue: SkillRequest[] = [];
  private status: GameSessionStatus = 'idle';
  private tickCount = 0;
  private loopHandle: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(event: GameSessionEvent) => void>();

  constructor(
    sessionId: string,
    endpoint: GameServerEndpoint,
    config: GameSessionConfig,
  ) {
    this.id = sessionId;
    this.endpoint = endpoint;

    this.state = createBattleFromLobby(
      config.lobby,
      '',
      config.botDifficulty ?? 'passive',
    );

    for (const player of this.state.players) {
      this.inputs[player.playerId] = DEFAULT_INPUT();
    }

    this.autoBuyForBots();
  }

  getStatus(): GameSessionStatus {
    return this.status;
  }

  getTick(): number {
    return this.tickCount;
  }

  getState(): BattleState {
    return this.state;
  }

  /** State safe to broadcast (no client-local fields required). */
  getPublicState(): BattleState {
    return { ...this.state, localPlayerId: '' };
  }

  subscribe(listener: (event: GameSessionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.status === 'running' || this.status === 'finished') return;

    this.status = 'running';
    this.emit({
      type: 'started',
      endpoint: this.endpoint,
      state: this.getPublicState(),
    });
  }

  startLoop(tickRateHz = 30): void {
    this.start();
    this.stopLoop();

    let last = Date.now();
    const intervalMs = 1000 / tickRateHz;

    this.loopHandle = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      this.tick(dt, now);
    }, intervalMs);
  }

  stop(): void {
    this.stopLoop();
    if (this.status === 'stopped') return;

    this.status = 'stopped';
    this.emit({ type: 'stopped' });
  }

  setInput(playerId: string, input: PlayerInput): void {
    this.inputs[playerId] = input;
  }

  buySkill(playerId: string, skillId: string): void {
    if (this.state.phase !== 'shop') return;

    const skill = this.state.shopOffers.find((offer) => offer.id === skillId);
    if (!skill) return;

    const players = this.state.players.map((player) => {
      if (player.playerId !== playerId) return player;

      const result = purchaseSkillLogic(player.gold, player.equippedSkills, skill);
      if (!result.success) return player;

      return {
        ...player,
        gold: result.gold,
        equippedSkills: [...player.equippedSkills, result.skill],
        isReady: false,
      };
    });

    this.updateState({ ...this.state, players });
  }

  buyGear(playerId: string, gearId: string): void {
    if (this.state.phase !== 'shop') return;

    const gear = this.state.gearOffers.find((offer) => offer.id === gearId);
    if (!gear) return;

    const players = this.state.players.map((player) => {
      if (player.playerId !== playerId) return player;

      const result = purchaseGearLogic(player.gold, player.equippedGear, gear);
      if (!result.success) return player;

      return {
        ...player,
        gold: result.gold,
        equippedGear: result.ownedGear,
        isReady: false,
      };
    });

    const playerMeta = players.find((player) => player.playerId === playerId);
    const entities = this.state.entities.map((entity) => {
      if (entity.playerId !== playerId || !playerMeta) return entity;

      return applyGearToEntity(
        entity,
        playerMeta.baseStats,
        playerMeta.bonusStats,
        playerMeta.equippedGear,
      );
    });

    this.updateState({ ...this.state, players, entities });
  }

  setRoundStatDraft(playerId: string, stats: CharacterStats): void {
    if (this.state.phase !== 'shop' || this.state.round <= 1) return;

    const players = this.state.players.map((player) =>
      player.playerId === playerId
        ? { ...player, roundStatDraft: stats, isReady: false }
        : player,
    );

    this.updateState({ ...this.state, players });
  }

  setReady(playerId: string): void {
    if (this.state.phase !== 'shop') return;

    const players = this.state.players.map((player) =>
      player.playerId === playerId ? { ...player, isReady: true } : player,
    );

    this.updateState(tryStartCombat({ ...this.state, players }));
  }

  queueSkill(entityId: string, skill: ShopSkill, aimX: number, aimZ: number): void {
    this.skillQueue.push({ entityId, skill, aimX, aimZ });
  }

  continueAfterRound(): void {
    if (this.state.phase !== 'round_end') return;

    const next = startNextRound(this.state);
    if (!next) return;

    this.skillQueue = [];
    this.updateState(next);
    this.autoBuyForBots();
  }

  autoBuyForBots(): void {
    if (this.state.phase !== 'shop') return;

    let next = { ...this.state };

    for (const player of next.players) {
      const entity = next.entities.find((entry) => entry.playerId === player.playerId);
      if (!entity?.isBot) continue;

      let gold = player.gold;
      let equippedSkills = [...player.equippedSkills];
      let equippedGear = [...player.equippedGear];
      let roundStatDraft = player.roundStatDraft;

      if (next.round > 1) {
        roundStatDraft = randomStatBudget(ROUND_BONUS_STAT_POINTS);
      }

      for (const skill of next.shopOffers) {
        if (gold < skill.price) continue;
        if (Math.random() > 0.55) continue;

        const result = purchaseSkillLogic(gold, equippedSkills, skill);
        if (!result.success) continue;

        gold = result.gold;
        equippedSkills = [...equippedSkills, result.skill];
        if (equippedSkills.length >= 2) break;
      }

      for (const gear of next.gearOffers) {
        const hasKind = equippedGear.some((owned) => owned.kind === gear.kind);
        if (hasKind) continue;
        if (Math.random() > 0.45) continue;

        const gearResult = purchaseGearLogic(gold, equippedGear, gear);
        if (!gearResult.success) continue;

        gold = gearResult.gold;
        equippedGear = gearResult.ownedGear;
      }

      const updatedEntity = applyGearToEntity(
        entity,
        player.baseStats,
        player.bonusStats,
        equippedGear,
      );

      next = {
        ...next,
        entities: next.entities.map((entry) =>
          entry.playerId === player.playerId ? updatedEntity : entry,
        ),
        players: next.players.map((entry) =>
          entry.playerId === player.playerId
            ? {
                ...entry,
                gold,
                equippedSkills,
                equippedGear,
                roundStatDraft,
                isReady: true,
              }
            : entry,
        ),
      };
    }

    this.updateState(tryStartCombat(next));
  }

  /** Advance simulation by dt seconds. Call from your own loop or use startLoop(). */
  tick(dt: number, now: number): void {
    if (this.status !== 'running' && this.status !== 'idle') return;

    if (this.state.phase === 'combat') {
      const cappedDt = Math.min(dt, 0.05);
      const pendingSkills = this.skillQueue.splice(0);
      const next = tickBattle(this.state, cappedDt, this.inputs, pendingSkills, now);

      const clearedInputs: Record<string, PlayerInput> = {};
      for (const [id, input] of Object.entries(this.inputs)) {
        clearedInputs[id] = { ...input, jump: false };
      }
      this.inputs = clearedInputs;

      this.updateState(next);
      return;
    }

    if (this.state.phase === 'match_end') {
      this.status = 'finished';
      this.stopLoop();
      this.emit({ type: 'match_finished', state: this.getPublicState() });
    }
  }

  handleClientMessage(message: import('../types/game-server.js').GameClientMessage): void {
    switch (message.type) {
      case 'input':
        this.setInput(message.playerId, message.input);
        break;
      case 'buy_skill':
        this.buySkill(message.playerId, message.skillId);
        break;
      case 'buy_gear':
        this.buyGear(message.playerId, message.gearId);
        break;
      case 'set_round_stat_draft':
        this.setRoundStatDraft(message.playerId, message.stats);
        break;
      case 'set_ready':
        this.setReady(message.playerId);
        break;
      case 'queue_skill':
        this.queueSkill(
          message.request.entityId,
          message.request.skill,
          message.request.aimX,
          message.request.aimZ,
        );
        break;
      case 'continue_after_round':
        this.continueAfterRound();
        break;
    }
  }

  private updateState(next: BattleState): void {
    this.state = next;
    this.tickCount += 1;
    this.emit({ type: 'state_updated', state: this.getPublicState(), tick: this.tickCount });
  }

  private emit(event: GameSessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private stopLoop(): void {
    if (this.loopHandle === null) return;
    clearInterval(this.loopHandle);
    this.loopHandle = null;
  }
}

export function createGameSession(
  sessionId: string,
  baseUrl: string,
  config: GameSessionConfig,
): GameSession {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const endpoint: GameServerEndpoint = {
    sessionId,
    url: `${normalizedBase}/${sessionId}`,
  };

  return new GameSession(sessionId, endpoint, config);
}
