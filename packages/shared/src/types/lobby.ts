import type { MatchMode } from './match.js';
import type { PlayerProfile } from './player.js';
import type { ArenaMapId } from './arena.js';

export type SlotSide = 'teamA' | 'teamB';

export type LobbyStatus = 'waiting' | 'ready' | 'in_progress';

export interface LobbySlot {
  id: string;
  side: SlotSide;
  index: number;
  occupant: PlayerProfile | null;
}

export interface Lobby {
  id: string;
  mode: MatchMode;
  hostId: string;
  slots: LobbySlot[];
  status: LobbyStatus;
  mapId: ArenaMapId;
  createdAt: number;
}

export type LobbyErrorCode =
  | 'slot_not_found'
  | 'slot_occupied'
  | 'slot_empty'
  | 'player_already_in_lobby'
  | 'not_host'
  | 'cannot_remove_player'
  | 'bot_on_own_team';

export interface LobbyError {
  code: LobbyErrorCode;
  message: string;
}

export type LobbyResult<T = Lobby> =
  | { success: true; data: T }
  | { success: false; error: LobbyError };
