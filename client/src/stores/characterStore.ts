import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createCharacter,
  type Character,
  type CharacterStats,
} from '@spellbound/shared';

interface CharacterState {
  characters: Character[];
  activeCharacterId: string | null;

  getCharactersForUser: (ownerId: string) => Character[];
  getActiveCharacter: (ownerId: string) => Character | null;
  addCharacter: (
    ownerId: string,
    name: string,
    stats: CharacterStats,
  ) => { success: true; character: Character } | { success: false; message: string };
  selectCharacter: (id: string) => void;
  deleteCharacter: (id: string, ownerId: string) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      characters: [],
      activeCharacterId: null,

      getCharactersForUser: (ownerId) =>
        get().characters.filter((c) => c.ownerId === ownerId),

      getActiveCharacter: (ownerId) => {
        const { characters, activeCharacterId } = get();
        const userChars = characters.filter((c) => c.ownerId === ownerId);
        if (activeCharacterId) {
          const found = userChars.find((c) => c.id === activeCharacterId);
          if (found) return found;
        }
        return userChars[0] ?? null;
      },

      addCharacter: (ownerId, name, stats) => {
        const userChars = get().characters.filter((c) => c.ownerId === ownerId);
        const result = createCharacter(ownerId, name, stats, userChars.length);

        if (!result.success) {
          return { success: false, message: result.error.message };
        }

        const character = result.data;
        set((state) => ({
          characters: [...state.characters, character],
          activeCharacterId: state.activeCharacterId ?? character.id,
        }));

        return { success: true, character };
      },

      selectCharacter: (id) => set({ activeCharacterId: id }),

      deleteCharacter: (id, ownerId) => {
        set((state) => {
          const characters = state.characters.filter(
            (c) => c.id !== id || c.ownerId !== ownerId,
          );
          const userChars = characters.filter((c) => c.ownerId === ownerId);
          const activeCharacterId =
            state.activeCharacterId === id
              ? (userChars[0]?.id ?? null)
              : state.activeCharacterId;

          return { characters, activeCharacterId };
        });
      },
    }),
    { name: 'spellbound-characters' },
  ),
);
