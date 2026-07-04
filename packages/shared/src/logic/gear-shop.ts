import {
  GEAR_OFFER_COUNT,
  GEAR_RARITY_PRICE,
  GEAR_RARITY_WEIGHTS,
  GEAR_STAT_BUDGET,
} from '../constants/battle.js';
import type { CharacterStats, StatKey } from '../types/character.js';
import { STAT_KEYS } from '../types/character.js';
import type { GearKind, GearRarity, ShopGear } from '../types/battle.js';
import { randomStatBudget } from './character.js';
import { getAllocatedPoints, mergeCharacterStats } from './character.js';
import { generateId } from '../utils/id.js';

const HELMET_NAMES = [
  'Iron Helm',
  'Knight Casque',
  'Spiked Helm',
  'Bronze Visor',
  'Warlord Crest',
  'Sunforged Helm',
] as const;

const HOOD_NAMES = [
  'Shadow Hood',
  'Mystic Cowl',
  'Wraith Veil',
  'Ash Cloak',
  'Void Shroud',
  'Ember Mantle',
] as const;

const CLOAK_NAMES = [
  'Traveler Cape',
  'Royal Mantle',
  'Storm Shawl',
  'Night Drape',
  'Phoenix Cloak',
  'Starweave Cape',
] as const;

const BELT_NAMES = [
  'Leather Belt',
  'Warband',
  'Golden Sash',
  'Chain Girdle',
  'Rune Buckle',
  'Adventurer Strap',
] as const;

const GLOVES_NAMES = [
  'Leather Grips',
  'Plate Gauntlets',
  'Silk Wraps',
  'Spiked Knuckles',
  'Ranger Gloves',
  'Battle Mitts',
] as const;

const BOOTS_NAMES = [
  'Leather Boots',
  'Iron Greaves',
  'Soft Slippers',
  'Heavy Sabatons',
  'Fur Boots',
  'Swift Treads',
] as const;

export const GEAR_NAME_POOLS: Record<GearKind, readonly string[]> = {
  helmet: HELMET_NAMES,
  hood: HOOD_NAMES,
  cloak: CLOAK_NAMES,
  belt: BELT_NAMES,
  gloves: GLOVES_NAMES,
  boots: BOOTS_NAMES,
};

export const GEAR_KINDS: readonly GearKind[] = [
  'cloak',
  'belt',
  'boots',
  'gloves',
  'hood',
  'helmet',
];

const STAT_SHORT: Record<StatKey, string> = {
  agility: 'AGI',
  strength: 'STR',
  intelligence: 'INT',
  fury: 'FURY',
  statusResistance: 'SRES',
  pushResistance: 'PRES',
};

function randomGearRarity(): GearRarity {
  const totalWeight = Object.values(GEAR_RARITY_WEIGHTS).reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * totalWeight;

  for (const rarity of ['common', 'uncommon', 'rare', 'epic'] as const) {
    roll -= GEAR_RARITY_WEIGHTS[rarity];
    if (roll <= 0) return rarity;
  }

  return 'common';
}

function randomGearPrice(rarity: GearRarity): number {
  const range = GEAR_RARITY_PRICE[rarity];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function pickGearName(kind: GearKind, used: Set<string>): string {
  const pool = GEAR_NAME_POOLS[kind];
  const available = pool.filter((n) => !used.has(n));
  const names = available.length > 0 ? available : [...pool];
  return names[Math.floor(Math.random() * names.length)]!;
}

function getVariantForName(kind: GearKind, name: string): number {
  const index = GEAR_NAME_POOLS[kind].indexOf(name);
  return index >= 0 ? index : 0;
}

function generateGearStats(rarity: GearRarity): CharacterStats {
  return randomStatBudget(GEAR_STAT_BUDGET[rarity]);
}

function createGearOffer(kind: GearKind, usedNames: Set<string>): ShopGear {
  const rarity = randomGearRarity();
  const name = pickGearName(kind, usedNames);
  usedNames.add(name);

  return {
    id: generateId(),
    name,
    price: randomGearPrice(rarity),
    kind,
    rarity,
    statBonus: generateGearStats(rarity),
    visualVariant: getVariantForName(kind, name),
  };
}

export function generateGearOffers(count = GEAR_OFFER_COUNT): ShopGear[] {
  const usedNames = new Set<string>();
  const offers: ShopGear[] = [];

  for (const kind of GEAR_KINDS) {
    offers.push(createGearOffer(kind, usedNames));
  }

  while (offers.length < count) {
    const kind = GEAR_KINDS[Math.floor(Math.random() * GEAR_KINDS.length)] ?? 'helmet';
    offers.push(createGearOffer(kind, usedNames));
  }

  return offers.sort(() => Math.random() - 0.5);
}

export function getGearStatPoints(gear: ShopGear): number {
  return getAllocatedPoints(gear.statBonus);
}

export function getGearStatLines(
  gear: ShopGear,
): { key: StatKey; value: number }[] {
  return STAT_KEYS.filter((key) => gear.statBonus[key] > 0).map((key) => ({
    key,
    value: gear.statBonus[key],
  }));
}

export function formatGearStatSummary(gear: ShopGear): string {
  const lines = getGearStatLines(gear);
  if (lines.length <= 2) {
    return lines.map((line) => `+${line.value} ${STAT_SHORT[line.key]}`).join(', ');
  }
  return `+${getGearStatPoints(gear)} stats`;
}

export function mergeGearStatBonuses(gear: ShopGear[]): CharacterStats {
  if (gear.length === 0) return mergeCharacterStats();
  return mergeCharacterStats(...gear.map((item) => item.statBonus));
}

function getGearRefund(ownedGear: ShopGear[], kind: GearKind): number {
  return ownedGear.find((g) => g.kind === kind)?.price ?? 0;
}

export function canAffordGear(
  gold: number,
  ownedGear: ShopGear[],
  gear: ShopGear,
): boolean {
  const refund = getGearRefund(ownedGear, gear.kind);
  return gold >= gear.price - refund;
}

export function purchaseGear(
  gold: number,
  ownedGear: ShopGear[],
  gear: ShopGear,
): { success: true; gold: number; ownedGear: ShopGear[] } | { success: false } {
  const refund = getGearRefund(ownedGear, gear.kind);
  const netCost = gear.price - refund;
  if (gold < netCost) return { success: false };

  const next = ownedGear.filter((item) => item.kind !== gear.kind);
  next.push({ ...gear });

  return {
    success: true,
    gold: gold - netCost,
    ownedGear: sortEquippedGear(next),
  };
}

export function getGearById(
  gearOffers: ShopGear[],
  gearId: string | null,
): ShopGear | null {
  if (!gearId) return null;
  return gearOffers.find((g) => g.id === gearId) ?? null;
}

export const GEAR_RENDER_ORDER: readonly GearKind[] = GEAR_KINDS;

export function sortGearKinds(kinds: GearKind[]): GearKind[] {
  return [...kinds].sort(
    (a, b) => GEAR_RENDER_ORDER.indexOf(a) - GEAR_RENDER_ORDER.indexOf(b),
  );
}

export function sortEquippedGear(gear: ShopGear[]): ShopGear[] {
  return [...gear].sort(
    (a, b) => GEAR_RENDER_ORDER.indexOf(a.kind) - GEAR_RENDER_ORDER.indexOf(b.kind),
  );
}
