import type { Character, CharacterDto, CharacterStats } from '@spellbound/shared';
import { characterApi } from '../api/character.api';
import { ApiError } from '../api/http-client';

export function mapCharacterDto(dto: CharacterDto, ownerId: string): Character {
  return {
    id: String(dto.id),
    ownerId,
    name: dto.name,
    stats: { ...dto.attributes },
    createdAt: 0,
  };
}

function mapApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return fallback;
}

export async function fetchUserCharacters(ownerId: string): Promise<Character[]> {
  const list = await characterApi.getAll();
  return list.map((dto) => mapCharacterDto(dto, ownerId));
}

export async function fetchSelectedCharacterId(ownerId: string): Promise<string | null> {
  try {
    const selected = await characterApi.getSelected();
    if (!selected) return null;
    return String(selected.id);
  } catch {
    return null;
  }
}

export async function selectUserCharacter(
  ownerId: string,
  characterId: string,
): Promise<{ success: true; character: Character } | { success: false; message: string }> {
  try {
    const response = await characterApi.select({
      characterId: Number(characterId),
    });

    return {
      success: true,
      character: mapCharacterDto(response, ownerId),
    };
  } catch (error) {
    return {
      success: false,
      message: mapApiError(error, 'Failed to select character.'),
    };
  }
}

export async function createUserCharacter(
  ownerId: string,
  name: string,
  stats: CharacterStats,
): Promise<{ success: true; character: Character } | { success: false; message: string }> {
  try {
    await characterApi.create({
      name: name.trim(),
      attributes: stats,
    });

    const characters = await fetchUserCharacters(ownerId);
    const trimmedName = name.trim();
    const created =
      characters.find((c) => c.name === trimmedName) ?? characters.at(-1);

    if (!created) {
      return { success: false, message: 'Character was created but could not be loaded.' };
    }

    return { success: true, character: created };
  } catch (error) {
    return {
      success: false,
      message: mapApiError(error, 'Failed to create character.'),
    };
  }
}
