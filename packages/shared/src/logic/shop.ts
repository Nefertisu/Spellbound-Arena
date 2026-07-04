import {

  SHOP_OFFER_COUNT,

  SKILL_PRICES,

  SKILL_SLOT_COUNT,

} from '../constants/battle.js';

import type { ShopSkill } from '../types/battle.js';

import { SKILL_KINDS, skillKindLabel } from '../types/battle.js';

import { generateId } from '../utils/id.js';



const SKILL_KIND_ICON_INDEX: Record<ShopSkill['kind'], number> = {

  fireball: 0,

  impulse: 1,

  blink: 2,

};



export function generateShopOffers(count = SHOP_OFFER_COUNT): ShopSkill[] {

  return SKILL_KINDS.slice(0, count).map((kind) => ({

    id: generateId(),

    name: skillKindLabel(kind),

    iconIndex: SKILL_KIND_ICON_INDEX[kind],

    price: SKILL_PRICES[kind],

    kind,

  }));

}



export function canAffordSkill(gold: number, skill: ShopSkill): boolean {

  return gold >= skill.price;

}



export function purchaseSkill(

  gold: number,

  ownedSkills: ShopSkill[],

  skill: ShopSkill,

): { success: true; gold: number; skill: ShopSkill } | { success: false } {

  if (ownedSkills.length >= SKILL_SLOT_COUNT) return { success: false };

  if (!canAffordSkill(gold, skill)) return { success: false };



  const inventorySkill: ShopSkill = {

    ...skill,

    id: generateId(),

  };



  return {

    success: true,

    gold: gold - skill.price,

    skill: inventorySkill,

  };

}


