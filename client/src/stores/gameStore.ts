import { create } from 'zustand';
import {
  addBotToSlot,
  createLobby as createLobbyState,
  createPlayerProfile,
  fillLobbyForBotMatch,
  joinSlot,
  leaveSlot,
  pickRandomArenaMap,
  removeBotFromSlot,
  type BotDifficulty,
  type Character,
  type Lobby,
  type MatchMode,
  type OpponentType,
} from '@spellbound/shared';
import { useBattleStore } from './battleStore';
import type { AppScreen, CharacterView } from '../types/app';

interface GameState {
  screen: AppScreen;
  lobby: Lobby | null;
  error: string | null;
  botDifficulty: BotDifficulty;
  characterEntryView: CharacterView;

  setScreen: (screen: AppScreen) => void;
  openCharacters: (view?: CharacterView) => void;
  clearCharacterEntryView: () => void;
  setBotDifficulty: (difficulty: BotDifficulty) => void;
  clearError: () => void;
  createLobby: (mode: MatchMode, userId: string, character: Character) => void;
  findMatch: (
    mode: MatchMode,
    opponentType: OpponentType,
    botDifficulty: BotDifficulty,
    userId: string,
    character: Character,
  ) => Promise<void>;
  joinLobbySlot: (slotId: string, userId: string, character: Character) => void;
  leaveLobbySlot: (slotId: string, userId: string) => void;
  placeBot: (slotId: string, requesterId: string) => void;
  removeBot: (slotId: string, requesterId: string) => void;
  leaveLobby: () => void;
  startBattle: (localPlayerId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  lobby: null,
  error: null,
  botDifficulty: 'passive',
  characterEntryView: 'roster',

  setScreen: (screen) => set({ screen }),
  openCharacters: (view = 'roster') => set({ screen: 'characters', characterEntryView: view }),
  clearCharacterEntryView: () => set({ characterEntryView: 'roster' }),
  setBotDifficulty: (botDifficulty) => set({ botDifficulty }),
  clearError: () => set({ error: null }),

  createLobby: (mode, userId, character) => {
    const lobby = createLobbyState(mode, userId, pickRandomArenaMap());
    const player = createPlayerProfile(userId, character);

    const teamASlot = lobby.slots.find((s) => s.side === 'teamA' && s.index === 0);
    if (!teamASlot) return;

    const result = joinSlot(lobby, teamASlot.id, player);
    if (!result.success) {
      set({ error: result.error.message });
      return;
    }

    set({ lobby: result.data, screen: 'lobby', error: null });
  },

  findMatch: async (mode, opponentType, botDifficulty, userId, character) => {
    const mapId = pickRandomArenaMap();
    const lobby = createLobbyState(mode, userId, mapId);
    const player = createPlayerProfile(userId, character);

    const teamASlot = lobby.slots.find((s) => s.side === 'teamA' && s.index === 0);
    if (!teamASlot) {
      set({ error: 'Could not create lobby.' });
      throw new Error('Could not create lobby.');
    }

    const joinResult = joinSlot(lobby, teamASlot.id, player);
    if (!joinResult.success) {
      set({ error: joinResult.error.message });
      throw new Error(joinResult.error.message);
    }

    const searchMs =
      opponentType === 'bots'
        ? 900 + Math.random() * 900
        : 1800 + Math.random() * 1400;

    await new Promise((resolve) => setTimeout(resolve, searchMs));

    let finalLobby =
      opponentType === 'bots'
        ? fillLobbyForBotMatch(joinResult.data)
        : joinResult.data;

    set({
      lobby: finalLobby,
      screen: 'lobby',
      botDifficulty,
      error: null,
    });
  },

  joinLobbySlot: (slotId, userId, character) => {
    const { lobby } = get();
    if (!lobby) return;

    const player = createPlayerProfile(userId, character);
    const result = joinSlot(lobby, slotId, player);

    if (!result.success) {
      set({ error: result.error.message });
      return;
    }

    set({ lobby: result.data, error: null });
  },

  leaveLobbySlot: (slotId, userId) => {
    const { lobby } = get();
    if (!lobby) return;

    const result = leaveSlot(lobby, slotId, userId);
    if (!result.success) {
      set({ error: result.error.message });
      return;
    }

    set({ lobby: result.data, error: null });
  },

  placeBot: (slotId, requesterId) => {
    const { lobby } = get();
    if (!lobby) return;

    const result = addBotToSlot(lobby, slotId, requesterId);
    if (!result.success) {
      set({ error: result.error.message });
      return;
    }

    set({ lobby: result.data, error: null });
  },

  removeBot: (slotId, requesterId) => {
    const { lobby } = get();
    if (!lobby) return;

    const result = removeBotFromSlot(lobby, slotId, requesterId);
    if (!result.success) {
      set({ error: result.error.message });
      return;
    }

    set({ lobby: result.data, error: null });
  },

  leaveLobby: () => {
    useBattleStore.getState().clearBattle();
    set({ lobby: null, screen: 'menu', error: null });
  },

  startBattle: (localPlayerId) => {
    const { lobby, botDifficulty } = get();
    if (!lobby) return;

    useBattleStore.getState().initBattle(
      { ...lobby, status: 'in_progress' },
      localPlayerId,
      botDifficulty,
    );
    set({ screen: 'battle', error: null });
  },
}));
