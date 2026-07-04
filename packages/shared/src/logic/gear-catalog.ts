import { GEAR_STAT_BUDGET, GEAR_RARITY_PRICE } from '../constants/battle.js';
import type { CharacterStats } from '../types/character.js';
import { STAT_KEYS } from '../types/character.js';
import type { GearKind, GearRarity, ShopGear } from '../types/battle.js';
import { GEAR_RARITIES } from '../types/battle.js';
import { mergeCharacterStats } from './character.js';
import { GEAR_KINDS, GEAR_NAME_POOLS } from './gear-shop.js';

function hashSeed(...parts: (string | number)[]): number {
  let hash = 2166136261;
  for (const part of parts) {
    const value = String(part);
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}

function createSeededRng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createPreviewGearStats(
  kind: GearKind,
  variant: number,
  rarity: GearRarity,
): CharacterStats {
  const budget = GEAR_STAT_BUDGET[rarity];
  const stats = mergeCharacterStats();
  if (budget <= 0) return stats;

  const rng = createSeededRng(hashSeed(kind, variant, rarity));
  let remaining = budget;

  while (remaining > 0) {
    const key = STAT_KEYS[Math.floor(rng() * STAT_KEYS.length)]!;
    const chunk = Math.min(remaining, 1 + Math.floor(rng() * 3));
    stats[key] += chunk;
    remaining -= chunk;
  }

  return stats;
}

export function getGearDisplayName(kind: GearKind, variant: number): string {
  const pool = GEAR_NAME_POOLS[kind];
  return pool[((variant % pool.length) + pool.length) % pool.length] ?? pool[0]!;
}

export function createPreviewGear(
  kind: GearKind,
  variant: number,
  rarity: GearRarity,
): ShopGear {
  const visualVariant = ((variant % GEAR_NAME_POOLS[kind].length) + GEAR_NAME_POOLS[kind].length)
    % GEAR_NAME_POOLS[kind].length;

  return {
    id: `preview-${kind}-${visualVariant}-${rarity}`,
    name: getGearDisplayName(kind, visualVariant),
    price: GEAR_RARITY_PRICE[rarity].min,
    kind,
    rarity,
    visualVariant,
    statBonus: createPreviewGearStats(kind, visualVariant, rarity),
  };
}

let cachedCatalog: ShopGear[] | null = null;

export function buildFittingRoomCatalog(): ShopGear[] {
  if (cachedCatalog) return cachedCatalog;

  const items: ShopGear[] = [];

  for (const kind of GEAR_KINDS) {
    const variantCount = GEAR_NAME_POOLS[kind].length;
    for (let variant = 0; variant < variantCount; variant++) {
      for (const rarity of GEAR_RARITIES) {
        items.push(createPreviewGear(kind, variant, rarity));
      }
    }
  }

  cachedCatalog = items;
  return items;
}

export function filterFittingRoomCatalog(
  catalog: ShopGear[],
  kind: GearKind,
  rarity: GearRarity | 'all',
): ShopGear[] {
  return catalog.filter((item) => {
    if (item.kind !== kind) return false;
    if (rarity !== 'all' && item.rarity !== rarity) return false;
    return true;
  });
}
