import type { Character } from './character.js';

export interface PlayerProfile {
  id: string;
  username: string;
  character: Character;
  isBot: boolean;
}
