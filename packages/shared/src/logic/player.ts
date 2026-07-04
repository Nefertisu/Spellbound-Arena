import type { Character } from '../types/character.js';
import type { PlayerProfile } from '../types/player.js';
import { createBotCharacter } from './character.js';

export function createBotProfile(): PlayerProfile {
  const character = createBotCharacter();
  return {
    id: character.id,
    username: character.name,
    character,
    isBot: true,
  };
}

export function createPlayerProfile(
  userId: string,
  character: Character,
): PlayerProfile {
  return {
    id: userId,
    username: character.name,
    character,
    isBot: false,
  };
}
