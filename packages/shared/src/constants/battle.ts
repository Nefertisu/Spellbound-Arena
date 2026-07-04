import type { GearRarity, SkillKind } from '../types/battle.js';

/** Round wins required to win the match (first to N). */
export const WINS_TO_WIN_MATCH = 3;
/** @deprecated Use {@link WINS_TO_WIN_MATCH} */
export const TOTAL_ROUNDS = WINS_TO_WIN_MATCH;
export const INITIAL_GOLD = 200;
export const ROUND_GOLD_BONUS = 150;
export const ROUND_BASE_GOLD = 200;
export const ROUND_WINNER_GOLD = 300;
export const INTERMISSION_COUNTDOWN_SEC = 3;
export const ROUND_BONUS_STAT_POINTS = 10;

export const ARENA_INITIAL_RADIUS = 40;
export const ARENA_MIN_RADIUS = 14;
export const ARENA_SHRINK_RATE = 0.35 / 3;
export const ARENA_LAVA_RING_WIDTH = 60;

export const LAVA_DAMAGE_PER_SEC = 30;
export const PLAYER_BASE_HP = 100;
export const CRATE_HP = 50;
export const PILLAR_HP = 80;

/** XZ half-size; matches ObstacleModel crate box 1.1×1.1 */
export const CRATE_HALF_EXTENTS = { x: 0.55, z: 0.55 };
/** Matches ObstacleModel pillar cylinder top radius */
export const PILLAR_COLLISION_RADIUS = 0.85;
export const PLAYER_COLLISION_RADIUS = 0.45;

export const GRAVITY = -32;
export const JUMP_FORCE = 8;
export const MOVE_SPEED = 6;
export const GROUND_Y = 0;

export const FIREBALL_DAMAGE = 40;
export const FIREBALL_SPEED = 18;
export const FIREBALL_RADIUS = 0.35;
export const FIREBALL_TTL = 3;

export const IMPULSE_DAMAGE = 25;
export const IMPULSE_RADIUS = 5;
export const IMPULSE_PUSH_FORCE = 14;

export const BLINK_DAMAGE = 30;
export const BLINK_RADIUS = 2.8;
export const BLINK_RANGE = 5;

export const SKILL_PRICES: Record<SkillKind, number> = {
  fireball: 75,
  impulse: 110,
  blink: 95,
};

export const SHOP_OFFER_COUNT = 3;
export const GEAR_OFFER_COUNT = 8;
export const GEAR_STAT_BUDGET: Record<GearRarity, number> = {
  common: 8,
  uncommon: 12,
  rare: 16,
  epic: 20,
};

export const GEAR_RARITY_WEIGHTS: Record<GearRarity, number> = {
  common: 42,
  uncommon: 30,
  rare: 20,
  epic: 8,
};

export const GEAR_RARITY_PRICE: Record<GearRarity, { min: number; max: number }> = {
  common: { min: 45, max: 70 },
  uncommon: { min: 65, max: 95 },
  rare: { min: 90, max: 120 },
  epic: { min: 110, max: 140 },
};

export const PLAYER_MAX_MANA = 100;
export const MANA_REGEN_PER_SEC = 2;
export const HP_REGEN_PER_SEC = 1;
export const SKILL_SLOT_COUNT = 12;
export const DAY_CYCLE_DURATION = 540;

export const SKILL_COOLDOWNS: Record<SkillKind, number> = {
  fireball: 2.5,
  impulse: 5,
  blink: 4,
};

export const SKILL_MANA_COSTS: Record<SkillKind, number> = {
  fireball: 30,
  impulse: 45,
  blink: 40,
};
