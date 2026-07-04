import type { CharacterStats } from '../types/character.js';
import { createEmptyStats, getAllocatedPoints, mergeCharacterStats } from './character.js';
import type { Lobby, SlotSide } from '../types/lobby.js';
import type { ArenaMapId } from '../types/arena.js';
import type {
  BattleEntity,
  BattleState,
  BotDifficulty,
  PlayerBattleMeta,
  ShopSkill,
  ShopGear,
  SkillKind,
  Vec3,
} from '../types/battle.js';
import {
  CRATE_HALF_EXTENTS,
  CRATE_HP,
  INITIAL_GOLD,
  PILLAR_COLLISION_RADIUS,
  PILLAR_HP,
  PLAYER_BASE_HP,
  PLAYER_COLLISION_RADIUS,
  HP_REGEN_PER_SEC,
  MANA_REGEN_PER_SEC,
  PLAYER_MAX_MANA,
  ROUND_BASE_GOLD,
  ROUND_WINNER_GOLD,
  ROUND_BONUS_STAT_POINTS,
  WINS_TO_WIN_MATCH,
} from '../constants/battle.js';
import { generateId } from '../utils/id.js';
import { generateShopOffers } from './shop.js';
import { generateGearOffers, mergeGearStatBonuses, sortEquippedGear, sortGearKinds } from './gear-shop.js';
import { getArenaMap, getArenaInitialRadius, getCrystalPlatformPatchRadius, getTeamSpawnPositions } from './arena-maps.js';

function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function computeMaxMana(stats?: CharacterStats): number {
  const bonus = stats ? stats.intelligence * 8 : 0;
  return PLAYER_MAX_MANA + bonus;
}

export function computeHpRegenPerSec(stats?: CharacterStats): number {
  const bonus = stats ? stats.strength * 0.3 : 0;
  return HP_REGEN_PER_SEC + bonus;
}

export function computeManaRegenPerSec(stats?: CharacterStats): number {
  const bonus = stats ? stats.intelligence * 0.5 : 0;
  return MANA_REGEN_PER_SEC + bonus;
}

export function computeMaxHp(
  type: BattleEntity['type'],
  stats?: CharacterStats,
): number {
  if (type === 'crate') return CRATE_HP;
  if (type === 'pillar') return PILLAR_HP;
  const bonus = stats ? stats.strength * 5 : 0;
  return PLAYER_BASE_HP + bonus;
}

function spawnPositions(
  mode: Lobby['mode'],
  side: SlotSide,
  mapId: ArenaMapId,
  arenaRadius: number = getArenaInitialRadius(mapId),
): Vec3[] {
  return getTeamSpawnPositions(mode, side, mapId, arenaRadius).map((pos) =>
    vec3(pos.x, pos.y, pos.z),
  );
}

function createPlayerEntity(
  occupant: NonNullable<Lobby['slots'][number]['occupant']>,
  teamId: SlotSide,
  position: Vec3,
): BattleEntity {
  const stats = occupant.character.stats;
  const maxHp = computeMaxHp('player', stats);
  const maxMana = computeMaxMana(stats);

  return {
    id: `entity-${occupant.id}`,
    type: 'player',
    teamId,
    name: occupant.username,
    position: { ...position },
    velocity: vec3(),
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    radius: PLAYER_COLLISION_RADIUS,
    isGrounded: true,
    facing: teamId === 'teamA' ? 0 : Math.PI,
    characterStats: { ...stats },
    playerId: occupant.isBot ? occupant.id : occupant.id,
    isBot: occupant.isBot,
    alive: true,
  };
}

function createObstacles(mapId: ArenaMapId): BattleEntity[] {
  const layouts = getArenaMap(mapId).obstacles;

  return layouts.map((layout, i) => ({
    id: `obstacle-${i}`,
    type: layout.type,
    teamId: 'neutral' as const,
    name: layout.type === 'crate' ? 'Crate' : 'Pillar',
    position: vec3(layout.x, 0, layout.z),
    velocity: vec3(),
    hp: computeMaxHp(layout.type),
    maxHp: computeMaxHp(layout.type),
    radius: layout.type === 'crate' ? CRATE_HALF_EXTENTS.x : PILLAR_COLLISION_RADIUS,
    halfExtents: layout.type === 'crate' ? { ...CRATE_HALF_EXTENTS } : undefined,
    isGrounded: true,
    facing: 0,
    isBot: false,
    alive: true,
    platformPatchRadius:
      mapId === 'crystal_rift'
        ? getCrystalPlatformPatchRadius(layout.type)
        : undefined,
  }));
}

function createPlayerMeta(
  occupant: NonNullable<Lobby['slots'][number]['occupant']>,
  teamId: SlotSide,
  round: number,
): PlayerBattleMeta {
  const gold = round === 1 ? INITIAL_GOLD : ROUND_BASE_GOLD;
  return {
    playerId: occupant.id,
    teamId,
    baseStats: { ...occupant.character.stats },
    bonusStats: createEmptyStats(),
    roundStatDraft: createEmptyStats(),
    gold,
    equippedSkills: [],
    equippedGear: [],
    isReady: occupant.isBot,
  };
}

export function createBattleFromLobby(
  lobby: Lobby,
  localPlayerId: string,
  botDifficulty: BotDifficulty = 'passive',
): BattleState {
  const entities: BattleEntity[] = [];
  const players: PlayerBattleMeta[] = [];

  for (const side of ['teamA', 'teamB'] as SlotSide[]) {
    const slots = lobby.slots
      .filter((s) => s.side === side && s.occupant)
      .sort((a, b) => a.index - b.index);
    const positions = spawnPositions(lobby.mode, side, lobby.mapId, getArenaInitialRadius(lobby.mapId));

    slots.forEach((slot, i) => {
      const occupant = slot.occupant!;
      entities.push(createPlayerEntity(occupant, side, positions[i] ?? vec3()));
      players.push(createPlayerMeta(occupant, side, 1));
    });
  }

  entities.push(...createObstacles(lobby.mapId));

  return {
    lobbyId: lobby.id,
    mode: lobby.mode,
    mapId: lobby.mapId,
    phase: 'shop',
    round: 1,
    winsToWin: WINS_TO_WIN_MATCH,
    arenaRadius: getArenaInitialRadius(lobby.mapId),
    corruptedPatches: [],
    entities,
    projectiles: [],
    shopOffers: generateShopOffers(),
    gearOffers: generateGearOffers(),
    players,
    roundWins: { teamA: 0, teamB: 0 },
    localPlayerId,
    botDifficulty,
    damageEvents: [],
    visualEvents: [],
    elapsedTime: 0,
    dayTime: 0.28,
    skillCooldowns: {},
    roundWinner: null,
    matchWinner: null,
    lastRoundMessage: null,
  };
}

export function resetEntitiesForRound(state: BattleState): BattleEntity[] {
  const players = state.entities.filter((e) => e.type === 'player');
  const obstacles = createObstacles(state.mapId);

  const resetPlayers = players.map((entity) => {
    const positions = spawnPositions(
      state.mode,
      entity.teamId as SlotSide,
      state.mapId,
      state.arenaRadius,
    );
    const teamPlayers = players.filter((p) => p.teamId === entity.teamId);
    const index = teamPlayers.findIndex((p) => p.id === entity.id);
    const pos = positions[index] ?? vec3();

    return {
      ...entity,
      position: { ...pos },
      velocity: vec3(),
      knockbackX: 0,
      knockbackZ: 0,
      hp: entity.maxHp,
      mana: entity.maxMana ?? computeMaxMana(entity.characterStats),
      isGrounded: true,
      alive: true,
      facing: entity.teamId === 'teamA' ? 0 : Math.PI,
    };
  });

  return [...resetPlayers, ...obstacles];
}

export function resetEntitiesToCenter(state: BattleState): BattleEntity[] {
  const players = state.entities.filter((e) => e.type === 'player');
  const obstacles = createObstacles(state.mapId);

  if (state.mapId === 'crystal_rift') {
    const resetPlayers = players.map((entity) => {
      const teamPlayers = players.filter((p) => p.teamId === entity.teamId);
      const index = teamPlayers.findIndex((p) => p.id === entity.id);
      const positions = spawnPositions(
        state.mode,
        entity.teamId as SlotSide,
        state.mapId,
        state.arenaRadius,
      );
      const pos = positions[index] ?? vec3();

      return {
        ...entity,
        position: { ...pos },
        velocity: vec3(),
        knockbackX: 0,
        knockbackZ: 0,
        hp: entity.maxHp,
        mana: entity.maxMana ?? computeMaxMana(entity.characterStats),
        isGrounded: true,
        alive: true,
        facing: entity.teamId === 'teamA' ? 0 : Math.PI,
      };
    });

    return [...resetPlayers, ...obstacles];
  }

  const count = players.length;

  const resetPlayers = players.map((entity, index) => {
    const angle = count > 0 ? (index / count) * Math.PI * 2 : 0;
    const radius = Math.min(4, 1.8 + count * 0.35);

    return {
      ...entity,
      position: vec3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
      velocity: vec3(),
      knockbackX: 0,
      knockbackZ: 0,
      hp: entity.maxHp,
      mana: entity.maxMana ?? computeMaxMana(entity.characterStats),
      isGrounded: true,
      alive: true,
      facing: entity.teamId === 'teamA' ? 0 : Math.PI,
    };
  });

  return [...resetPlayers, ...obstacles];
}

export function getRoundGoldAward(
  teamId: SlotSide,
  roundWinner: SlotSide | null,
): number {
  if (!roundWinner) return ROUND_BASE_GOLD;
  return teamId === roundWinner ? ROUND_WINNER_GOLD : ROUND_BASE_GOLD;
}

export function getEquippedSkills(
  state: BattleState,
  playerId: string,
): ShopSkill[] {
  const meta = state.players.find((p) => p.playerId === playerId);
  return meta?.equippedSkills ?? [];
}

export function getEquippedGear(
  state: BattleState,
  playerId: string,
): ShopGear[] {
  const meta = state.players.find((p) => p.playerId === playerId);
  return meta?.equippedGear ?? [];
}

export function getEffectivePlayerStats(meta: PlayerBattleMeta): CharacterStats {
  return mergeCharacterStats(
    meta.baseStats,
    meta.bonusStats,
    meta.roundStatDraft,
  );
}

function applyCombatStatsToEntities(
  state: BattleState,
  players: PlayerBattleMeta[],
): BattleEntity[] {
  return state.entities.map((entity) => {
    if (entity.type !== 'player' || !entity.playerId) return entity;

    const meta = players.find((p) => p.playerId === entity.playerId);
    if (!meta) return entity;

    const gearStats = mergeGearStatBonuses(meta.equippedGear);
    const stats = mergeCharacterStats(meta.baseStats, meta.bonusStats, gearStats);
    const maxHp = computeMaxHp('player', stats);
    const maxMana = computeMaxMana(stats);

    return {
      ...entity,
      characterStats: stats,
      maxHp,
      maxMana,
      hp: maxHp,
      mana: maxMana,
      equippedGearKinds: sortGearKinds(
        meta.equippedGear.map((gear) => gear.kind),
      ),
      equippedGear: sortEquippedGear(meta.equippedGear),
    };
  });
}

export function isRoundStatDraftComplete(
  state: BattleState,
  player: PlayerBattleMeta,
): boolean {
  if (state.round <= 1) return true;
  return getAllocatedPoints(player.roundStatDraft) === ROUND_BONUS_STAT_POINTS;
}

export function startCombatPhase(state: BattleState): BattleState {
  const players = state.players.map((p) => {
    const bonusStats =
      state.round > 1
        ? mergeCharacterStats(p.bonusStats, p.roundStatDraft)
        : p.bonusStats;

    return {
      ...p,
      bonusStats,
      roundStatDraft: createEmptyStats(),
      equippedSkills: getEquippedSkills(state, p.playerId),
      equippedGear: getEquippedGear(state, p.playerId),
      isReady: true,
    };
  });

  return {
    ...state,
    phase: 'combat',
    players,
    entities: applyCombatStatsToEntities(state, players),
    corruptedPatches: [],
    projectiles: [],
    damageEvents: [],
    visualEvents: [],
    elapsedTime: 0,
    dayTime: 0.28,
    skillCooldowns: {},
  };
}

export function startNextRound(state: BattleState): BattleState | null {
  if (state.matchWinner) return null;

  const nextRound = state.round + 1;
  const winner = state.roundWinner;
  const players = state.players.map((p) => ({
    ...p,
    gold: getRoundGoldAward(p.teamId, winner),
    roundStatDraft: createEmptyStats(),
    isReady: state.entities.find((e) => e.playerId === p.playerId)?.isBot ?? false,
  }));

  const resetEntities = resetEntitiesToCenter(state);

  return {
    ...state,
    phase: 'shop',
    round: nextRound,
    arenaRadius: getArenaInitialRadius(state.mapId),
    corruptedPatches: [],
    entities: applyCombatStatsToEntities(
      { ...state, entities: resetEntities },
      players,
    ),
    projectiles: [],
    shopOffers: generateShopOffers(),
    gearOffers: generateGearOffers(),
    players,
    damageEvents: [],
    visualEvents: [],
    elapsedTime: 0,
    dayTime: 0.28,
    skillCooldowns: {},
    roundWinner: null,
    lastRoundMessage: null,
  };
}

export function appendDamageEvent(
  state: BattleState,
  targetId: string,
  amount: number,
  position: Vec3,
  now: number,
  skillKind?: SkillKind,
): BattleState {
  return {
    ...state,
    damageEvents: [
      ...state.damageEvents,
      {
        id: generateId(),
        targetId,
        amount: Math.round(amount),
        position: { ...position },
        createdAt: now,
        skillKind,
      },
    ],
  };
}
