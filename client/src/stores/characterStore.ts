import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Character, CharacterStats } from '@spellbound/shared';
import {
  createUserCharacter,
  fetchSelectedCharacterId,
  fetchUserCharacters,
  selectUserCharacter,
} from '../services/character.service';
import {
  getLastSelectedCharacterId,
  setLastSelectedCharacterId,
} from '../utils/lastSelectedCharacterStorage';

type CharacterLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CharacterState {
  characters: Character[];
  activeCharacterId: string | null;
  status: CharacterLoadStatus;
  error: string | null;
  ownerId: string | null;

  loadCharacters: (ownerId: string, options?: { force?: boolean }) => Promise<void>;
  getCharactersForUser: (ownerId: string) => Character[];
  getActiveCharacter: (ownerId: string) => Character | null;
  createCharacter: (
    ownerId: string,
    name: string,
    stats: CharacterStats,
  ) => Promise<{ success: true; character: Character } | { success: false; message: string }>;
  selectCharacter: (
    ownerId: string,
    characterId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  clearCharacters: () => void;
}

const EMPTY_CHARACTERS: Character[] = [];

export function selectCharactersForUser(
  state: CharacterState,
  ownerId: string,
): Character[] {
  if (!ownerId || state.ownerId !== ownerId) {
    return EMPTY_CHARACTERS;
  }

  return state.characters;
}

export function selectActiveCharacterForUser(
  state: CharacterState,
  ownerId: string,
): Character | null {
  if (!ownerId || state.ownerId !== ownerId || !state.activeCharacterId) {
    return null;
  }

  return state.characters.find((character) => character.id === state.activeCharacterId) ?? null;
}

export function useUserCharacters(ownerId: string | undefined): Character[] {
  return useCharacterStore(
    useShallow((state) =>
      ownerId ? selectCharactersForUser(state, ownerId) : EMPTY_CHARACTERS,
    ),
  );
}

export function useActiveCharacter(ownerId: string | undefined): Character | null {
  return useCharacterStore((state) =>
    ownerId ? selectActiveCharacterForUser(state, ownerId) : null,
  );
}

function pickDefaultCharacterId(
  characters: Character[],
  savedCharacterId: string | null,
): string | null {
  if (characters.length === 0) return null;
  if (characters.length === 1) return characters[0]!.id;

  if (savedCharacterId && characters.some((character) => character.id === savedCharacterId)) {
    return savedCharacterId;
  }

  return characters[0]?.id ?? null;
}

function pickActiveCharacterId(
  ownerId: string,
  characters: Character[],
  activeCharacterId: string | null,
): string | null {
  if (
    activeCharacterId &&
    characters.some((character) => character.id === activeCharacterId)
  ) {
    return activeCharacterId;
  }

  return pickDefaultCharacterId(characters, getLastSelectedCharacterId(ownerId));
}

export const useCharacterStore = create<CharacterState>()((set, get) => ({
  characters: [],
  activeCharacterId: null,
  status: 'idle',
  error: null,
  ownerId: null,

  loadCharacters: async (ownerId, options = {}) => {
    const snapshot = get();
    const isSameOwnerRefresh =
      !options.force && snapshot.ownerId === ownerId && snapshot.status === 'ready';

    if (!isSameOwnerRefresh) {
      set({ status: 'loading', error: null, ownerId });
    } else {
      set({ ownerId });
    }

    try {
      const fetched = await fetchUserCharacters(ownerId);
      const serverSelectedId = await fetchSelectedCharacterId(ownerId);
      const { activeCharacterId: currentActiveId } = get();
      const nextActiveId = pickActiveCharacterId(
        ownerId,
        fetched,
        serverSelectedId ?? currentActiveId,
      );

      if (nextActiveId) {
        setLastSelectedCharacterId(ownerId, nextActiveId);
      }

      set({
        characters: fetched,
        status: 'ready',
        activeCharacterId: nextActiveId,
        ownerId,
      });
    } catch {
      set((state) => ({
        status: 'error',
        error: 'Could not load characters.',
        characters: isSameOwnerRefresh ? state.characters : [],
        activeCharacterId: isSameOwnerRefresh ? state.activeCharacterId : null,
        ownerId,
      }));
    }
  },

  getCharactersForUser: (ownerId) => selectCharactersForUser(get(), ownerId),

  getActiveCharacter: (ownerId) => selectActiveCharacterForUser(get(), ownerId),

  createCharacter: async (ownerId, name, stats) => {
    const result = await createUserCharacter(ownerId, name, stats);

    if (!result.success) {
      return result;
    }

    await get().loadCharacters(ownerId, { force: true });
    const selectResult = await get().selectCharacter(ownerId, result.character.id);
    if (!selectResult.success) {
      return { success: false, message: selectResult.message ?? 'Failed to select character.' };
    }

    const refreshed = get().characters.find((c) => c.id === result.character.id);
    return { success: true, character: refreshed ?? result.character };
  },

  selectCharacter: async (ownerId, characterId) => {
    const previousId = get().activeCharacterId;
    set({
      ownerId,
      activeCharacterId: characterId,
      error: null,
    });

    const result = await selectUserCharacter(ownerId, characterId);
    if (!result.success) {
      set({
        activeCharacterId: previousId,
        error: result.message,
      });
      return { success: false, message: result.message };
    }

    setLastSelectedCharacterId(ownerId, characterId);
    set({
      ownerId,
      activeCharacterId: characterId,
      error: null,
    });

    return { success: true };
  },

  clearCharacters: () =>
    set({
      characters: [],
      activeCharacterId: null,
      status: 'idle',
      error: null,
      ownerId: null,
    }),
}));

export function selectActiveCharacter(
  userId: string,
  characterId: string,
): Promise<{ success: boolean; message?: string }> {
  return useCharacterStore.getState().selectCharacter(userId, characterId);
}

export function readActiveCharacter(userId: string): Character | null {
  return useCharacterStore.getState().getActiveCharacter(userId);
}
