import {
  CRATE_HALF_EXTENTS,
  PILLAR_COLLISION_RADIUS,
  type CharacterStats,
  type GearKind,
  type ShopGear,
} from '@spellbound/shared';
import { MannequinModel } from './MannequinModel';

interface CharacterModelProps {
  stats?: CharacterStats;
  colorizeByStats?: boolean;
  isBot?: boolean;
  animate?: boolean;
  feetOnGround?: boolean;
  nightBoost?: number;
  headGear?: GearKind | null;
  equippedGearKinds?: GearKind[];
  equippedGear?: ShopGear[];
}

export function CharacterModel({
  stats,
  colorizeByStats = false,
  isBot,
  animate = true,
  feetOnGround = false,
  nightBoost = 0,
  headGear = null,
  equippedGearKinds,
  equippedGear,
}: CharacterModelProps) {
  return (
    <MannequinModel
      stats={stats}
      colorizeByStats={colorizeByStats}
      isBot={isBot}
      animate={animate}
      feetOnGround={feetOnGround}
      nightBoost={nightBoost}
      headGear={headGear}
      equippedGearKinds={equippedGearKinds}
      equippedGear={equippedGear}
    />
  );
}

interface ObstacleModelProps {
  type: 'crate' | 'pillar';
  hpRatio: number;
  nightBoost?: number;
  variant?: 'default' | 'crystal';
}

export function ObstacleModel({
  type,
  hpRatio,
  nightBoost = 0,
  variant = 'default',
}: ObstacleModelProps) {
  const isCrystal = variant === 'crystal';
  const color = isCrystal
    ? hpRatio > 0.5
      ? '#48b8d8'
      : '#286888'
    : hpRatio > 0.5
      ? '#5a4030'
      : '#3a2820';
  const emissive = isCrystal ? '#2080c0' : color;
  const emissiveIntensity = isCrystal
    ? 0.55 + nightBoost * 0.35
    : 0.08 + nightBoost * 0.42;

  if (type === 'pillar') {
    if (isCrystal) {
      return (
        <group position={[0, 1.5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.95, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              roughness={0.12}
              metalness={0.6}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0, -0.85, 0]}>
            <cylinderGeometry args={[0.18, 0.35, 1.1, 6]} />
            <meshStandardMaterial
              color="#1a2048"
              emissive="#3040a0"
              emissiveIntensity={0.5}
              roughness={0.4}
              metalness={0.45}
            />
          </mesh>
        </group>
      );
    }

    return (
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[PILLAR_COLLISION_RADIUS, PILLAR_COLLISION_RADIUS + 0.15, 2.2, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
        />
      </mesh>
    );
  }

  const crateSize = CRATE_HALF_EXTENTS.x * 2;
  if (isCrystal) {
    return (
      <group position={[0, crateSize / 2, 0]}>
        <mesh rotation={[0.4, 0.6, 0.2]}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.15}
            metalness={0.55}
          />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[crateSize * 0.7, 0.2, crateSize * 0.7]} />
          <meshStandardMaterial
            color="#1a1838"
            emissive="#4030a0"
            emissiveIntensity={0.35}
            roughness={0.5}
          />
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={[0, crateSize / 2, 0]}>
      <boxGeometry args={[crateSize, crateSize, crateSize]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.85}
      />
    </mesh>
  );
}
