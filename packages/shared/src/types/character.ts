export const STAT_KEYS = [
  "agility",
  "strength",
  "intelligence",
  "fury",
  "statusResistance",
  "pushResistance",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export interface CharacterStats {
  agility: number;
  strength: number;
  intelligence: number;
  fury: number;
  statusResistance: number;
  pushResistance: number;
}

export interface Character {
  id: string;
  ownerId: string;
  name: string;
  stats: CharacterStats;
  createdAt: number;
}

export const INITIAL_STAT_POINTS = 20;
export const MAX_CHARACTERS_PER_USER = 5;

export const STAT_LABELS: Record<StatKey, string> = {
  agility: "Agility",
  strength: "Strength",
  intelligence: "Intelligence",
  fury: "Fury",
  statusResistance: "Status Resistance",
  pushResistance: "Push Resistance",
};

export const STAT_DESCRIPTIONS: Record<StatKey, string> = {
  agility: "Movement speed and dodge chance",
  strength: "Physical damage and health",
  intelligence: "Spell power and mana",
  fury: "Reduces opponent healing",
  statusResistance: "Resistance to debuffs and crowd control",
  pushResistance: "Weakens knockback and displacement",
};

export interface CreateCharacterDto {
  name: string;
  attributes: CharacterAttributes;
}

export interface CreateCharacterDtoResponse {
  name: string;
  attributes: CharacterAttributes;
}

/** GET /character — single character from API */
export interface CharacterDto {
  id: number;
  name: string;
  attributes: CharacterAttributes;
}

/** POST /character/select — request body */
export interface SelectCharacterDto {
  characterId: number;
}

/** POST /character/select — response */
export type SelectCharacterDtoResponse = CharacterDto;

/** GET /character/selected — response */
export type SelectedCharacterDtoResponse = CharacterDto | null;

export interface CharacterAttributes {
  agility: number;
  strength: number;
  intelligence: number;
  fury: number;
  statusResistance: number;
  pushResistance: number;
}
