import {
  ARENA_INITIAL_RADIUS,
  ARENA_MIN_RADIUS,
  ARENA_SHRINK_RATE,
} from '../constants/battle.js';
import type {
  ArenaMapDefinition,
  ArenaMapId,
  ArenaObstacleLayout,
  CorruptedPlatformPatch,
} from '../types/arena.js';
import { ARENA_MAP_IDS } from '../types/arena.js';

export const CRYSTAL_RIFT_SIZE_MULTIPLIER = 2;
export const CRYSTAL_RIFT_SHRINK_DIVISOR = 8;
export const CRYSTAL_INNER_VOID_RATIO = 0.34;
export const CRYSTAL_PLATFORM_INSET = 1.2;
export const CRYSTAL_WEDGE_GAP = 0.22;
export const CRYSTAL_PILLAR_PATCH_RADIUS = 10;
export const CRYSTAL_CRATE_PATCH_RADIUS = 7;
export const CRYSTAL_CORRUPTED_PATCH_GROWTH_MULTIPLIER = 2;
export const CRYSTAL_CORRUPTED_PATCH_MAX_RADIUS_MULTIPLIER = 2;

const CRYSTAL_TEAM_WEDGE: Record<'teamA' | 'teamB', number> = {
  teamA: 2,
  teamB: 0,
};

function getCrystalWedgeCenterAngle(wedgeIndex: number): number {
  const wedgeAngle = Math.PI / 2;
  const span = wedgeAngle - CRYSTAL_WEDGE_GAP * 2;
  return wedgeIndex * wedgeAngle + CRYSTAL_WEDGE_GAP + span / 2;
}

export function getCrystalSafePlatformInnerRadius(arenaRadius: number): number {
  return arenaRadius * CRYSTAL_INNER_VOID_RATIO + CRYSTAL_PLATFORM_INSET;
}

export function getCrystalSafeSpawnRadius(arenaRadius: number): number {
  const inner = getCrystalSafePlatformInnerRadius(arenaRadius);
  return inner + (arenaRadius - inner) * 0.32;
}

const LAVA_PIT: ArenaMapDefinition = {
  id: 'lava_pit',
  name: 'Lava Pit',
  description: 'Classic circular arena ringed with molten lava. Crates and stone pillars break sightlines.',
  obstacles: [
    { type: 'crate', x: -10, z: 0 },
    { type: 'crate', x: 10, z: 0 },
    { type: 'crate', x: 0, z: -12 },
    { type: 'crate', x: 0, z: 12 },
    { type: 'pillar', x: -14, z: -10 },
    { type: 'pillar', x: 14, z: 10 },
    { type: 'pillar', x: 14, z: -10 },
    { type: 'pillar', x: -14, z: 10 },
  ],
  theme: {
    floorStyle: 'circle',
    floorColorDay: '#3a2818',
    floorColorNight: '#4a3424',
    floorEmissive: '#2a1810',
    hazardColor: '#8b2020',
    hazardEmissive: '#ff3030',
    groundPlaneColor: '#1a0808',
    accentColor: '#c9a227',
    accentEmissive: '#ff6020',
  },
};

const CRYSTAL_RIFT: ArenaMapDefinition = {
  id: 'crystal_rift',
  name: 'Crystal Rift',
  description:
    'Fractured floating platforms around a glowing void rift. Break crystal nodes to corrupt the ground beneath them.',
  obstacles: [],
  theme: {
    floorStyle: 'crystal_rift',
    floorColorDay: '#142040',
    floorColorNight: '#1a2858',
    floorEmissive: '#103060',
    hazardColor: '#120828',
    hazardEmissive: '#9040ff',
    groundPlaneColor: '#05020f',
    accentColor: '#60f0ff',
    accentEmissive: '#40c8ff',
  },
};

const ARENA_MAPS: Record<ArenaMapId, ArenaMapDefinition> = {
  lava_pit: LAVA_PIT,
  crystal_rift: CRYSTAL_RIFT,
};

export function getArenaMap(mapId: ArenaMapId): ArenaMapDefinition {
  return ARENA_MAPS[mapId];
}

export function getAllArenaMaps(): ArenaMapDefinition[] {
  return ARENA_MAP_IDS.map((id) => ARENA_MAPS[id]);
}

export function pickRandomArenaMap(): ArenaMapId {
  const index = Math.floor(Math.random() * ARENA_MAP_IDS.length);
  return ARENA_MAP_IDS[index] ?? 'lava_pit';
}

export function getArenaInitialRadius(mapId: ArenaMapId): number {
  return mapId === 'crystal_rift'
    ? ARENA_INITIAL_RADIUS * CRYSTAL_RIFT_SIZE_MULTIPLIER
    : ARENA_INITIAL_RADIUS;
}

export function getArenaMinRadius(mapId: ArenaMapId): number {
  return mapId === 'crystal_rift'
    ? ARENA_MIN_RADIUS * CRYSTAL_RIFT_SIZE_MULTIPLIER
    : ARENA_MIN_RADIUS;
}

export function getArenaShrinkRate(mapId: ArenaMapId): number {
  if (mapId === 'crystal_rift') {
    return ARENA_SHRINK_RATE / CRYSTAL_RIFT_SHRINK_DIVISOR;
  }
  return ARENA_SHRINK_RATE;
}

/** Corrupted void patches on Crystal Rift expand faster than the outer lava ring closes. */
export function getCrystalCorruptedPatchGrowthRate(mapId: ArenaMapId): number {
  if (mapId !== 'crystal_rift') return 0;
  return getArenaShrinkRate(mapId) * CRYSTAL_CORRUPTED_PATCH_GROWTH_MULTIPLIER;
}

export function getTeamSpawnPositions(
  mode: '1v1' | '2v2' | '3v3',
  side: 'teamA' | 'teamB',
  mapId: ArenaMapId,
  arenaRadius: number = getArenaInitialRadius(mapId),
): { x: number; y: number; z: number }[] {
  const count = mode === '1v1' ? 1 : mode === '2v2' ? 2 : 3;

  if (mapId !== 'crystal_rift') {
    const z = side === 'teamA' ? -8 : 8;
    const spacing = 6;
    const startX = -((count - 1) * spacing) / 2;
    return Array.from({ length: count }, (_, i) => ({
      x: startX + i * spacing,
      y: 0,
      z,
    }));
  }

  const wedgeIndex = CRYSTAL_TEAM_WEDGE[side];
  const centerAngle = getCrystalWedgeCenterAngle(wedgeIndex);
  const spawnRadius = getCrystalSafeSpawnRadius(arenaRadius);
  const tangentAngle = centerAngle + Math.PI / 2;
  const spacing = 8;

  return Array.from({ length: count }, (_, i) => {
    const offset = (i - (count - 1) / 2) * spacing;
    return {
      x: Math.cos(centerAngle) * spawnRadius + Math.cos(tangentAngle) * offset,
      y: 0,
      z: Math.sin(centerAngle) * spawnRadius + Math.sin(tangentAngle) * offset,
    };
  });
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isOnCrystalPlatformWedge(angle: number): boolean {
  const twoPi = Math.PI * 2;
  const normalized = ((angle % twoPi) + twoPi) % twoPi;
  const wedgeSize = Math.PI / 2;
  const local = normalized % wedgeSize;
  return local >= CRYSTAL_WEDGE_GAP && local <= wedgeSize - CRYSTAL_WEDGE_GAP;
}

function isNearAnyCrystalSpawn(x: number, z: number, arenaRadius: number): boolean {
  const modes = ['1v1', '2v2', '3v3'] as const;
  const sides = ['teamA', 'teamB'] as const;

  for (const mode of modes) {
    for (const side of sides) {
      const spawns = getTeamSpawnPositions(mode, side, 'crystal_rift', arenaRadius);
      for (const spawn of spawns) {
        if (Math.hypot(x - spawn.x, z - spawn.z) < 9) return true;
      }
    }
  }

  return false;
}

/** Breakable crystal nodes that leave growing void patches when destroyed. */
export function buildCrystalRiftObstacles(): ArenaObstacleLayout[] {
  const arenaRadius = getArenaInitialRadius('crystal_rift');
  const platformInner = getCrystalSafePlatformInnerRadius(arenaRadius);
  const platformOuter = arenaRadius - 2.5;
  const rand = mulberry32(44012);
  const obstacles: ArenaObstacleLayout[] = [];
  const minDistance = 5.5;
  const targetCount = 52;

  let attempts = 0;
  while (obstacles.length < targetCount && attempts < 1400) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    if (!isOnCrystalPlatformWedge(angle)) continue;

    const dist = platformInner + rand() * (platformOuter - platformInner);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (isCrystalInnerVoid(x, z, arenaRadius)) continue;
    if (isNearAnyCrystalSpawn(x, z, arenaRadius)) continue;
    if (obstacles.some((obstacle) => Math.hypot(obstacle.x - x, obstacle.z - z) < minDistance)) {
      continue;
    }

    obstacles.push({
      type: rand() < 0.44 ? 'pillar' : 'crate',
      x: Math.round(x),
      z: Math.round(z),
    });
  }

  return obstacles;
}

CRYSTAL_RIFT.obstacles = buildCrystalRiftObstacles();

export function getCrystalPlatformPatchRadius(
  type: 'crate' | 'pillar',
): number {
  return type === 'pillar' ? CRYSTAL_PILLAR_PATCH_RADIUS : CRYSTAL_CRATE_PATCH_RADIUS;
}

export function isCrystalInnerVoid(
  x: number,
  z: number,
  arenaRadius: number,
): boolean {
  return Math.hypot(x, z) < arenaRadius * CRYSTAL_INNER_VOID_RATIO;
}

export function isCrystalPlatformHazard(
  x: number,
  z: number,
  arenaRadius: number,
  corruptedPatches: readonly CorruptedPlatformPatch[],
): boolean {
  if (isCrystalInnerVoid(x, z, arenaRadius)) return true;

  for (const patch of corruptedPatches) {
    if (Math.hypot(x - patch.x, z - patch.z) <= patch.radius) return true;
  }

  return false;
}
