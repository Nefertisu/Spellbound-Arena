import type { Character, CharacterStats, StatKey } from '../types/character.js';
import {
  INITIAL_STAT_POINTS,
  MAX_CHARACTERS_PER_USER,
  STAT_KEYS,
} from '../types/character.js';
import { generateId } from '../utils/id.js';

export type CharacterErrorCode =
  | 'empty_name'
  | 'name_too_long'
  | 'stats_not_fully_allocated'
  | 'max_characters_reached'
  | 'character_not_found'
  | 'invalid_stat_value';

export interface CharacterError {
  code: CharacterErrorCode;
  message: string;
}

export type CharacterResult<T = Character> =
  | { success: true; data: T }
  | { success: false; error: CharacterError };

export function createEmptyStats(): CharacterStats {
  return {
    agility: 0,
    strength: 0,
    intelligence: 0,
    fury: 0,
    statusResistance: 0,
    pushResistance: 0,
  };
}

export function getAllocatedPoints(stats: CharacterStats): number {
  return STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
}

export function getRemainingPoints(stats: CharacterStats): number {
  return getRemainingAllocatablePoints(stats, INITIAL_STAT_POINTS);
}

export function getRemainingAllocatablePoints(
  stats: CharacterStats,
  budget: number,
): number {
  return budget - getAllocatedPoints(stats);
}

export function canIncrementStat(stats: CharacterStats): boolean {
  return canIncrementStatWithBudget(stats, INITIAL_STAT_POINTS);
}

export function canIncrementStatWithBudget(
  stats: CharacterStats,
  budget: number,
): boolean {
  return getRemainingAllocatablePoints(stats, budget) > 0;
}

export function mergeCharacterStats(
  ...parts: CharacterStats[]
): CharacterStats {
  const merged = createEmptyStats();
  for (const part of parts) {
    for (const key of STAT_KEYS) {
      merged[key] += part[key];
    }
  }
  return merged;
}

export function canDecrementStat(stats: CharacterStats, key: StatKey): boolean {
  return stats[key] > 0;
}

export function incrementStat(
  stats: CharacterStats,
  key: StatKey,
  budget: number = INITIAL_STAT_POINTS,
): CharacterStats | null {
  if (!canIncrementStatWithBudget(stats, budget)) return null;
  return { ...stats, [key]: stats[key] + 1 };
}

export function decrementStat(
  stats: CharacterStats,
  key: StatKey,
): CharacterStats | null {
  if (!canDecrementStat(stats, key)) return null;
  return { ...stats, [key]: stats[key] - 1 };
}

export function validateCharacterStats(stats: CharacterStats): CharacterError | null {
  for (const key of STAT_KEYS) {
    if (stats[key] < 0) {
      return {
        code: 'invalid_stat_value',
        message: `${key} cannot be negative.`,
      };
    }
  }

  const allocated = getAllocatedPoints(stats);
  if (allocated !== INITIAL_STAT_POINTS) {
    return {
      code: 'stats_not_fully_allocated',
      message: `Allocate all ${INITIAL_STAT_POINTS} stat points (${allocated}/${INITIAL_STAT_POINTS} used).`,
    };
  }

  return null;
}

export function validateCharacterName(name: string): CharacterError | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return { code: 'empty_name', message: 'Character name is required.' };
  }
  if (trimmed.length > 24) {
    return { code: 'name_too_long', message: 'Name must be 24 characters or less.' };
  }
  return null;
}

export function canCreateCharacter(existingCount: number): boolean {
  return existingCount < MAX_CHARACTERS_PER_USER;
}

export function createCharacter(
  ownerId: string,
  name: string,
  stats: CharacterStats,
  existingCount: number,
): CharacterResult {
  if (!canCreateCharacter(existingCount)) {
    return {
      success: false,
      error: {
        code: 'max_characters_reached',
        message: `Maximum of ${MAX_CHARACTERS_PER_USER} characters allowed.`,
      },
    };
  }

  const nameError = validateCharacterName(name);
  if (nameError) return { success: false, error: nameError };

  const statsError = validateCharacterStats(stats);
  if (statsError) return { success: false, error: statsError };

  return {
    success: true,
    data: {
      id: generateId(),
      ownerId,
      name: name.trim(),
      stats: { ...stats },
      createdAt: Date.now(),
    },
  };
}

export function randomStatBudget(budget: number): CharacterStats {
  const stats = createEmptyStats();
  let remaining = budget;
  const keys = [...STAT_KEYS];

  while (remaining > 0) {
    const key = keys[Math.floor(Math.random() * keys.length)]!;
    stats[key]++;
    remaining--;
  }

  return stats;
}

function randomStatDistribution(): CharacterStats {
  return randomStatBudget(INITIAL_STAT_POINTS);
}

const BOT_NAMES = [
  'Grimshade',
  'Bonecaller',
  'Ashwraith',
  'Dreadmaw',
  'Nightveil',
  'Soulreaper',
] as const;

let botCounter = 0;

export function createBotCharacter(): Character {
  const index = botCounter++;
  return {
    id: `bot-char-${generateId()}`,
    ownerId: 'system',
    name: BOT_NAMES[index % BOT_NAMES.length] ?? `Bot ${index + 1}`,
    stats: randomStatDistribution(),
    createdAt: Date.now(),
  };
}

export function getDominantStat(stats: CharacterStats): StatKey {
  return STAT_KEYS.reduce((best, key) =>
    stats[key] > stats[best] ? key : best,
  );
}
