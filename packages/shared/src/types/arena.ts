import type { EntityType } from './battle.js';

export type ArenaMapId = 'lava_pit' | 'crystal_rift';

export const ARENA_MAP_IDS: readonly ArenaMapId[] = ['lava_pit', 'crystal_rift'] as const;

export type ArenaFloorStyle = 'circle' | 'crystal_rift';

export interface ArenaObstacleLayout {
  type: Extract<EntityType, 'crate' | 'pillar'>;
  x: number;
  z: number;
}

export interface CorruptedPlatformPatch {
  x: number;
  z: number;
  radius: number;
  /** Grows over time on Crystal Rift; defaults to radius * 2 when omitted */
  maxRadius?: number;
}

export interface ArenaMapTheme {
  floorStyle: ArenaFloorStyle;
  floorColorDay: string;
  floorColorNight: string;
  floorEmissive: string;
  hazardColor: string;
  hazardEmissive: string;
  groundPlaneColor: string;
  accentColor: string;
  accentEmissive: string;
}

export interface ArenaMapDefinition {
  id: ArenaMapId;
  name: string;
  description: string;
  obstacles: ArenaObstacleLayout[];
  theme: ArenaMapTheme;
}

export function arenaMapLabel(mapId: ArenaMapId): string {
  switch (mapId) {
    case 'lava_pit':
      return 'Lava Pit';
    case 'crystal_rift':
      return 'Crystal Rift';
  }
}
