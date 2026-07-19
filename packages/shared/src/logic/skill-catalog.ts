import {
  BLINK_DAMAGE,
  BLINK_RADIUS,
  BLINK_RANGE,
  FIREBALL_DAMAGE,
  FIREBALL_RADIUS,
  FIREBALL_SPEED,
  FIREBALL_TTL,
  IMPULSE_DAMAGE,
  IMPULSE_PUSH_FORCE,
  IMPULSE_RADIUS,
  SKILL_COOLDOWNS,
  SKILL_MANA_COSTS,
  SKILL_PRICES,
} from "../constants/battle.js";

import type { SkillKind } from "../types/battle.js";

import { SKILL_KINDS } from "../types/battle.js";

export interface SkillStatLine {
  label: string;

  value: string;
}

export interface SkillDefinition {
  kind: SkillKind;

  label: string;

  icon: string;

  themeColor: string;

  emissiveColor: string;

  description: string;

  playstyle: string;

  mechanics: string[];

  stats: SkillStatLine[];
}

const FIREBALL_MAX_RANGE = Math.round(FIREBALL_SPEED * FIREBALL_TTL);

const SKILL_DEFINITIONS: Record<SkillKind, SkillDefinition> = {
  fireball: {
    kind: "fireball",

    label: "Fireball",

    icon: "🔥",

    themeColor: "#ff6020",

    emissiveColor: "#ff4010",

    description:
      "Hurl a flaming bolt along the ground in your aim direction. The projectile travels in a straight line at high speed until it strikes the first hostile target or expires.",

    playstyle:
      "Best for poking at range, finishing low targets, and pressuring enemies behind cover.",

    mechanics: [
      "Single-target — damages the first hostile the projectile touches",

      `Hit radius: ${FIREBALL_RADIUS} around the projectile center (forgiving collision)`,

      `Travel speed: ${FIREBALL_SPEED} units/s for up to ${FIREBALL_TTL}s (~${FIREBALL_MAX_RANGE} units max range)`,

      "Stops on the first valid hostile hit; does not pierce targets",
    ],

    stats: [
      { label: "Damage", value: String(FIREBALL_DAMAGE) },

      { label: "Mana cost", value: String(SKILL_MANA_COSTS.fireball) },

      { label: "Cooldown", value: `${SKILL_COOLDOWNS.fireball}s` },

      { label: "Projectile speed", value: String(FIREBALL_SPEED) },

      { label: "Hit radius", value: String(FIREBALL_RADIUS) },

      { label: "Lifetime", value: `${FIREBALL_TTL}s` },

      { label: "Shop price", value: `${SKILL_PRICES.fireball} gold` },
    ],
  },

  impulse: {
    kind: "impulse",

    label: "Impulse",

    icon: "💨",

    themeColor: "#6080ff",

    emissiveColor: "#4060cc",

    description:
      "Release a circular shockwave centered on yourself. Every hostile inside the area takes instant damage and is knocked away from you.",

    playstyle:
      "Strong when enemies cluster nearby — great for edge control and breaking pushes.",

    mechanics: [
      `Area radius: ${IMPULSE_RADIUS} around your position at cast time`,

      "Hits all hostiles inside the circle instantly — no travel time",

      `Knockback force: ${IMPULSE_PUSH_FORCE} — reduced by enemy Push Resistance`,

      "You are the center of the blast; allies are not affected",
    ],

    stats: [
      { label: "Damage", value: String(IMPULSE_DAMAGE) },

      { label: "Mana cost", value: String(SKILL_MANA_COSTS.impulse) },

      { label: "Cooldown", value: `${SKILL_COOLDOWNS.impulse}s` },

      { label: "Area radius", value: String(IMPULSE_RADIUS) },

      { label: "Knockback force", value: String(IMPULSE_PUSH_FORCE) },

      { label: "Shop price", value: `${SKILL_PRICES.impulse} gold` },
    ],
  },

  blink: {
    kind: "blink",

    label: "Blink",

    icon: "⚡",

    themeColor: "#c9a227",

    emissiveColor: "#ffe080",

    description:
      "Phase forward a short distance along your aim vector. Arcane energy erupts where you leave and where you arrive, damaging nearby hostiles.",

    playstyle:
      "Use to reposition, dodge, or punish enemies who stand on your departure or landing point.",

    mechanics: [
      `Teleport distance: up to ${BLINK_RANGE} units in your aim direction`,

      "Destination is clamped at the arena edge if the dash would leave the island",

      `Blast radius: ${BLINK_RADIUS} at both departure and arrival points`,

      "You never damage yourself; enemies can be hit by one or both blasts",
    ],

    stats: [
      { label: "Damage", value: String(BLINK_DAMAGE) },

      { label: "Mana cost", value: String(SKILL_MANA_COSTS.blink) },

      { label: "Cooldown", value: `${SKILL_COOLDOWNS.blink}s` },

      { label: "Teleport range", value: String(BLINK_RANGE) },

      { label: "Blast radius", value: String(BLINK_RADIUS) },

      { label: "Shop price", value: `${SKILL_PRICES.blink} gold` },
    ],
  },
};

export function getSkillDefinitions(): SkillDefinition[] {
  return SKILL_KINDS.map((kind) => SKILL_DEFINITIONS[kind]);
}

export function getSkillDefinition(kind: SkillKind): SkillDefinition {
  return SKILL_DEFINITIONS[kind];
}
