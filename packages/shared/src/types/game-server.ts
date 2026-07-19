import type { BotDifficulty, BattleState, PlayerInput, ShopSkill } from './battle.js';
import type { CharacterStats } from './character.js';
import type { Lobby } from './lobby.js';

/** Where clients connect for a live match (pass over lobby/match socket). */
export interface GameServerEndpoint {
  sessionId: string;
  /** e.g. ws://localhost:3001/game/{sessionId} */
  url: string;
}

export type GameSessionStatus = 'idle' | 'running' | 'finished' | 'stopped';

export interface GameSessionConfig {
  lobby: Lobby;
  botDifficulty?: BotDifficulty;
  /** Simulation ticks per second when startLoop() is used. Default 30. */
  tickRateHz?: number;
}

export interface SpawnGameSessionOptions extends GameSessionConfig {
  sessionId?: string;
  /** Base WS URL without session suffix, e.g. ws://localhost:3001/game */
  baseUrl: string;
}

export interface SkillRequest {
  entityId: string;
  skill: ShopSkill;
  aimX: number;
  aimZ: number;
}

export type GameClientMessage =
  | { type: 'input'; playerId: string; input: PlayerInput }
  | { type: 'buy_skill'; playerId: string; skillId: string }
  | { type: 'buy_gear'; playerId: string; gearId: string }
  | { type: 'set_round_stat_draft'; playerId: string; stats: CharacterStats }
  | { type: 'set_ready'; playerId: string }
  | { type: 'queue_skill'; request: SkillRequest }
  | { type: 'continue_after_round' };

export type GameSessionEvent =
  | { type: 'started'; endpoint: GameServerEndpoint; state: BattleState }
  | { type: 'state_updated'; state: BattleState; tick: number }
  | { type: 'match_finished'; state: BattleState }
  | { type: 'stopped' };

export interface GameSessionSnapshot {
  sessionId: string;
  status: GameSessionStatus;
  tick: number;
  state: BattleState;
  endpoint: GameServerEndpoint;
}
