import type { CharacterStats } from './character.js';
import type { MatchMode } from './match.js';
import type { SlotSide } from './lobby.js';
import type { ArenaMapId } from './arena.js';
import type { CorruptedPlatformPatch } from './arena.js';
export type EntityType = 'player' | 'crate' | 'pillar';

export type SkillKind = 'fireball' | 'impulse' | 'blink';

export const SKILL_KINDS: readonly SkillKind[] = ['fireball', 'impulse', 'blink'] as const;

export function skillKindLabel(kind: SkillKind): string {
  switch (kind) {
    case 'fireball':
      return 'Fireball';
    case 'impulse':
      return 'Impulse';
    case 'blink':
      return 'Blink';
  }
}

export type GearKind = 'helmet' | 'hood' | 'cloak' | 'belt' | 'gloves' | 'boots';

export type GearRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export const GEAR_RARITIES: readonly GearRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
] as const;

export type BattlePhase = 'shop' | 'combat' | 'round_end' | 'match_end';

export type BotDifficulty = 'passive' | 'easy';

export const BOT_DIFFICULTIES: readonly BotDifficulty[] = ['passive', 'easy'] as const;

export function botDifficultyLabel(difficulty: BotDifficulty): string {
  switch (difficulty) {
    case 'passive':
      return 'Passive';
    case 'easy':
      return 'Easy';
  }
}

export function gearKindLabel(kind: GearKind): string {
  switch (kind) {
    case 'helmet':
      return 'Helmet';
    case 'hood':
      return 'Hood';
    case 'cloak':
      return 'Cloak';
    case 'belt':
      return 'Belt';
    case 'gloves':
      return 'Gloves';
    case 'boots':
      return 'Boots';
  }
}

export function gearRarityLabel(rarity: GearRarity): string {
  switch (rarity) {
    case 'common':
      return 'Common';
    case 'uncommon':
      return 'Uncommon';
    case 'rare':
      return 'Rare';
    case 'epic':
      return 'Epic';
  }
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShopSkill {
  id: string;
  name: string;
  iconIndex: number;
  price: number;
  kind: SkillKind;
}

export interface ShopGear {
  id: string;
  name: string;
  price: number;
  kind: GearKind;
  rarity: GearRarity;
  statBonus: CharacterStats;
  visualVariant: number;
}

export interface BattleEntity {
  id: string;
  type: EntityType;
  teamId: SlotSide | 'neutral';
  name: string;
  position: Vec3;
  velocity: Vec3;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  radius: number;
  /** Axis-aligned box half-size on XZ; uses circle collision when omitted */
  halfExtents?: { x: number; z: number };
  isGrounded: boolean;
  facing: number;
  characterStats?: CharacterStats;
  playerId?: string;
  isBot: boolean;
  alive: boolean;
  /** Horizontal knockback impulse (players); decays separately from movement input */
  knockbackX?: number;
  knockbackZ?: number;
  equippedGearKinds?: GearKind[];
  equippedGear?: ShopGear[];
  /** Crystal Rift: safe platform area removed when this obstacle is destroyed */
  platformPatchRadius?: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  ownerTeam: SlotSide;
  position: Vec3;
  velocity: Vec3;
  damage: number;
  radius: number;
  ttl: number;
}

export interface DamageEvent {
  id: string;
  targetId: string;
  amount: number;
  position: Vec3;
  createdAt: number;
  skillKind?: SkillKind;
}

export type SkillVisualEventKind = 'cast' | 'aoe' | 'impact' | 'teleport';

export interface SkillVisualEvent {
  id: string;
  skillKind: SkillKind;
  kind: SkillVisualEventKind;
  position: Vec3;
  targetPosition?: Vec3;
  radius: number;
  createdAt: number;
}

export interface PlayerBattleMeta {
  playerId: string;
  teamId: SlotSide;
  /** Character stats at match start — never change */
  baseStats: CharacterStats;
  /** Permanent bonus stats earned across rounds */
  bonusStats: CharacterStats;
  /** Draft allocation for the current round's bonus points */
  roundStatDraft: CharacterStats;
  gold: number;
  equippedSkills: ShopSkill[];
  equippedGear: ShopGear[];
  isReady: boolean;
}

export interface BattleState {
  lobbyId: string;
  mode: MatchMode;
  mapId: ArenaMapId;
  phase: BattlePhase;
  round: number;
  /** Round wins needed to win the match (first to N). */
  winsToWin: number;
  arenaRadius: number;
  corruptedPatches: CorruptedPlatformPatch[];
  entities: BattleEntity[];
  projectiles: Projectile[];
  shopOffers: ShopSkill[];
  gearOffers: ShopGear[];
  players: PlayerBattleMeta[];
  roundWins: Record<SlotSide, number>;
  localPlayerId: string;
  botDifficulty: BotDifficulty;
  damageEvents: DamageEvent[];
  visualEvents: SkillVisualEvent[];
  elapsedTime: number;
  dayTime: number;
  skillCooldowns: Record<string, Record<string, number>>;
  roundWinner: SlotSide | null;
  matchWinner: SlotSide | null;
  lastRoundMessage: string | null;
}

export interface PlayerInput {
  moveX: number;
  moveZ: number;
  jump: boolean;
  skillIndex: number | null;
  aimX: number;
  aimZ: number;
}
