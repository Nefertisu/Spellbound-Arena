// Types
export type {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
} from './types/auth.js';
export type {
  Character,
  CharacterStats,
  StatKey,
} from './types/character.js';
export {
  INITIAL_STAT_POINTS,
  MAX_CHARACTERS_PER_USER,
  STAT_DESCRIPTIONS,
  STAT_KEYS,
  STAT_LABELS,
} from './types/character.js';
export type {
  Lobby,
  LobbyError,
  LobbyResult,
  LobbySlot,
  LobbyStatus,
  SlotSide,
} from './types/lobby.js';
export type { MatchMode, OpponentType } from './types/match.js';
export {
  MATCH_MODES,
  OPPONENT_TYPES,
  matchModeLabel,
  opponentTypeLabel,
  playersPerTeam,
} from './types/match.js';
export type { PlayerProfile } from './types/player.js';
export type {
  FetchPlayerRatingRequest,
  FetchPlayerRatingResult,
  PlayerRatingSnapshot,
} from './types/player-rating.js';
export type {
  ArenaFloorStyle,
  ArenaMapDefinition,
  ArenaMapId,
  ArenaMapTheme,
  ArenaObstacleLayout,
  CorruptedPlatformPatch,
} from './types/arena.js';
export { ARENA_MAP_IDS, arenaMapLabel } from './types/arena.js';

// Logic
export {
  fetchPlayerRating,
  formatRating,
  formatWinRate,
} from './logic/rating-api.js';
export type { CharacterError, CharacterErrorCode, CharacterResult } from './logic/character.js';
export {
  canCreateCharacter,
  canDecrementStat,
  canIncrementStat,
  canIncrementStatWithBudget,
  createBotCharacter,
  createCharacter,
  createEmptyStats,
  decrementStat,
  getAllocatedPoints,
  getDominantStat,
  getRemainingPoints,
  getRemainingAllocatablePoints,
  incrementStat,
  mergeCharacterStats,
  randomStatBudget,
  validateCharacterName,
  validateCharacterStats,
} from './logic/character.js';
export {
  addBotToSlot,
  fillLobbyForBotMatch,
  canStartMatch,
  createLobby,
  findPlayerSlot,
  findSlot,
  getLobbyReadiness,
  getTeamSlots,
  joinSlot,
  leaveSlot,
  removeBotFromSlot,
} from './logic/lobby.js';
export {
  CRYSTAL_CRATE_PATCH_RADIUS,
  CRYSTAL_INNER_VOID_RATIO,
  CRYSTAL_PLATFORM_INSET,
  CRYSTAL_PILLAR_PATCH_RADIUS,
  CRYSTAL_RIFT_SHRINK_DIVISOR,
  CRYSTAL_RIFT_SIZE_MULTIPLIER,
  CRYSTAL_WEDGE_GAP,
  getAllArenaMaps,
  getArenaInitialRadius,
  getArenaMinRadius,
  getArenaMap,
  getArenaShrinkRate,
  getTeamSpawnPositions,
  getCrystalPlatformPatchRadius,
  getCrystalSafePlatformInnerRadius,
  getCrystalSafeSpawnRadius,
  isCrystalInnerVoid,
  isCrystalPlatformHazard,
  pickRandomArenaMap,
  buildCrystalRiftObstacles,
} from './logic/arena-maps.js';
export { createBotProfile, createPlayerProfile } from './logic/player.js';

// Battle
export {
  ARENA_INITIAL_RADIUS,
  ARENA_LAVA_RING_WIDTH,
  ARENA_MIN_RADIUS,
  ARENA_SHRINK_RATE,
  BLINK_DAMAGE,
  BLINK_RADIUS,
  BLINK_RANGE,
  CRATE_HALF_EXTENTS,
  FIREBALL_DAMAGE,
  FIREBALL_RADIUS,
  GRAVITY,
  IMPULSE_DAMAGE,
  INITIAL_GOLD,
  JUMP_FORCE,
  LAVA_DAMAGE_PER_SEC,
  MANA_REGEN_PER_SEC,
  MOVE_SPEED,
  HP_REGEN_PER_SEC,
  PILLAR_COLLISION_RADIUS,
  PLAYER_COLLISION_RADIUS,
  ROUND_GOLD_BONUS,
  ROUND_BASE_GOLD,
  ROUND_WINNER_GOLD,
  ROUND_BONUS_STAT_POINTS,
  INTERMISSION_COUNTDOWN_SEC,
  SKILL_COOLDOWNS,
  SKILL_MANA_COSTS,
  SKILL_PRICES,
  SKILL_SLOT_COUNT,
  WINS_TO_WIN_MATCH,
  TOTAL_ROUNDS,
  GEAR_OFFER_COUNT,
  GEAR_RARITY_PRICE,
  GEAR_RARITY_WEIGHTS,
  GEAR_STAT_BUDGET,
} from './constants/battle.js';
export type {
  BattleEntity,
  BattlePhase,
  BattleState,
  BotDifficulty,
  DamageEvent,
  EntityType,
  GearKind,
  GearRarity,
  PlayerBattleMeta,
  PlayerInput,
  Projectile,
  ShopGear,
  ShopSkill,
  SkillKind,
  SkillVisualEvent,
  SkillVisualEventKind,
  Vec3,
} from './types/battle.js';
export { BOT_DIFFICULTIES, botDifficultyLabel, GEAR_RARITIES, gearKindLabel, gearRarityLabel, skillKindLabel, SKILL_KINDS } from './types/battle.js';
export {
  appendDamageEvent,
  computeHpRegenPerSec,
  computeManaRegenPerSec,
  computeMaxHp,
  computeMaxMana,
  createBattleFromLobby,
  getEquippedSkills,
  getEquippedGear,
  resetEntitiesForRound,
  resetEntitiesToCenter,
  getRoundGoldAward,
  getEffectivePlayerStats,
  isRoundStatDraftComplete,
  startCombatPhase,
  startNextRound,
} from './logic/battle-init.js';
export {
  advanceDayTime,
  formatBattleTime,
  getDayNightDialPosition,
  getDayNightLighting,
  isDaytime,
  type DayNightLighting,
} from './logic/battle-time.js';
export {
  allPlayersReady,
  applySkill,
  canCastSkill,
  getEnemyEntities,
  getLocalPlayerEntity,
  getSkillCooldownRemaining,
  tickBattle,
} from './logic/battle-sim.js';
export {
  canAffordSkill,
  generateShopOffers,
  purchaseSkill,
} from './logic/shop.js';
export {
  canAffordGear,
  formatGearStatSummary,
  generateGearOffers,
  getGearById,
  getGearStatLines,
  getGearStatPoints,
  mergeGearStatBonuses,
  purchaseGear,
  sortGearKinds,
  sortEquippedGear,
  GEAR_RENDER_ORDER,
  GEAR_KINDS,
} from './logic/gear-shop.js';
export {
  buildFittingRoomCatalog,
  createPreviewGear,
  filterFittingRoomCatalog,
  getGearDisplayName,
} from './logic/gear-catalog.js';
export {
  getSkillDefinition,
  getSkillDefinitions,
  type SkillDefinition,
  type SkillStatLine,
} from './logic/skill-catalog.js';

// Utils
export { generateId } from './utils/id.js';
