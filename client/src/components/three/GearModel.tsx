import type { GearKind, GearRarity } from '@spellbound/shared';

export interface GearModelProps {
  kind: GearKind;
  variant?: number;
  rarity?: GearRarity;
  nightBoost?: number;
  hoodUnderHelmet?: boolean;
}

type Vec3 = [number, number, number];

const RARITY_ACCENT: Record<GearRarity, string> = {
  common: '#c8ccd4',
  uncommon: '#5fe85f',
  rare: '#5cb8ff',
  epic: '#d090ff',
};

const FABRIC_PALETTES = [
  { main: '#342e42', trim: '#8a7898', lining: '#1e1828' },
  { main: '#3a3058', trim: '#7060a8', lining: '#221c38' },
  { main: '#283848', trim: '#5888a8', lining: '#141c28' },
  { main: '#403428', trim: '#a89060', lining: '#241e14' },
  { main: '#382848', trim: '#a060c0', lining: '#1a1024' },
  { main: '#483018', trim: '#c87838', lining: '#281808' },
] as const;

const LEATHER_PALETTES = [
  { main: '#5c4434', trim: '#3a2818', stitch: '#8a6848' },
  { main: '#4a3828', trim: '#2a2018', stitch: '#7a5840' },
  { main: '#6e5440', trim: '#4a3828', stitch: '#9a7858' },
  { main: '#3c3428', trim: '#242018', stitch: '#6a5848' },
  { main: '#5a4838', trim: '#3a2c20', stitch: '#8a7050' },
  { main: '#4a4238', trim: '#2c2618', stitch: '#7a6858' },
] as const;

const METAL_PALETTES = [
  { main: '#a8aeb8', trim: '#6a7078', dark: '#4a5058' },
  { main: '#9098a0', trim: '#5a6268', dark: '#3a4048' },
  { main: '#b09860', trim: '#887038', dark: '#584820' },
  { main: '#808088', trim: '#585060', dark: '#383038' },
  { main: '#d0b050', trim: '#a88828', dark: '#685818' },
  { main: '#b8c0c8', trim: '#889098', dark: '#586068' },
] as const;

function GearMaterial({
  color,
  accent,
  roughness = 0.55,
  metalness = 0.2,
  nightBoost = 0,
  opacity = 1,
}: {
  color: string;
  accent?: string;
  roughness?: number;
  metalness?: number;
  nightBoost?: number;
  opacity?: number;
}) {
  const emissive = accent ?? color;
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={(accent ? 0.32 : 0.1) + nightBoost * 0.4}
      roughness={roughness}
      metalness={metalness}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function RarityGem({ accent, position = [0, 0, 0] as Vec3, scale = 1 }: { accent: string; position?: Vec3; scale?: number }) {
  return (
    <mesh position={position} scale={scale}>
      <octahedronGeometry args={[0.03, 0]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} roughness={0.12} metalness={0.4} />
    </mesh>
  );
}

function RarityTrim({
  accent,
  position,
  rotation = [0, 0, 0] as Vec3,
  radius = 0.17,
}: {
  accent: string;
  position: Vec3;
  rotation?: Vec3;
  radius?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, 0.011, 6, 28]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} roughness={0.18} metalness={0.55} />
    </mesh>
  );
}

function FabricPanel({
  position,
  rotation = [0, 0, 0] as Vec3,
  size,
  color,
  accent,
  nightBoost,
  roughness = 0.86,
  opacity = 1,
}: {
  position: Vec3;
  rotation?: Vec3;
  size: Vec3;
  color: string;
  accent?: string;
  nightBoost: number;
  roughness?: number;
  opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <GearMaterial color={color} accent={accent} roughness={roughness} nightBoost={nightBoost} opacity={opacity} />
    </mesh>
  );
}

function MetalBuckle({
  position,
  accent,
  nightBoost,
  size = 0.08,
}: {
  position: Vec3;
  accent: string;
  nightBoost: number;
  size?: number;
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.55, size * 0.12, 6, 16]} />
        <GearMaterial color="#c0a848" accent={accent} metalness={0.65} roughness={0.22} nightBoost={nightBoost} />
      </mesh>
      <mesh position={[0, 0, size * 0.15]}>
        <cylinderGeometry args={[size * 0.18, size * 0.18, size * 0.08, 8]} />
        <GearMaterial color="#e8d060" accent={accent} metalness={0.7} roughness={0.18} nightBoost={nightBoost} />
      </mesh>
    </group>
  );
}

function HelmetVariant({
  variant,
  accent,
  rarity,
  nightBoost,
}: {
  variant: number;
  accent: string;
  rarity: GearRarity;
  nightBoost: number;
}) {
  const v = ((variant % 6) + 6) % 6;
  const metal = METAL_PALETTES[v]!;
  const showGem = rarity === 'rare' || rarity === 'epic';

  if (v === 1) {
    return (
      <group position={[0, 1.68, 0]}>
        <mesh position={[0, 0.16, 0]}>
          <coneGeometry args={[0.1, 0.38, 12]} />
          <GearMaterial color={metal.main} accent={accent} metalness={0.64} roughness={0.2} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.02, 0]} scale={[1.08, 0.8, 1.08]}>
          <sphereGeometry args={[0.17, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <GearMaterial color={metal.trim} accent={accent} metalness={0.58} roughness={0.26} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.06, 0.02]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.165, 0.018, 8, 24]} />
          <GearMaterial color={metal.dark} accent={accent} metalness={0.55} roughness={0.3} nightBoost={nightBoost} />
        </mesh>
        {showGem && <RarityGem accent={accent} position={[0, 0.22, 0.1]} />}
      </group>
    );
  }

  if (v === 2) {
    return (
      <group position={[0, 1.68, 0]}>
        <mesh position={[0, 0.04, 0]} scale={[1.05, 0.74, 1.05]}>
          <sphereGeometry args={[0.17, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <GearMaterial color={metal.main} accent={accent} metalness={0.56} roughness={0.28} nightBoost={nightBoost} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.57) * 0.15, 0.2, Math.sin(i * 1.57) * 0.15]} rotation={[0.2, i * 1.57, 0]}>
            <coneGeometry args={[0.034, 0.18, 6]} />
            <GearMaterial color="#c0c8d0" accent={accent} metalness={0.7} roughness={0.16} nightBoost={nightBoost} />
          </mesh>
        ))}
        <RarityTrim accent={accent} position={[0, -0.02, 0.05]} rotation={[0.22, 0, 0]} />
      </group>
    );
  }

  if (v === 3) {
    return (
      <group position={[0, 1.68, 0]}>
        <mesh position={[0, 0.02, 0]} scale={[1.05, 0.85, 1.02]}>
          <cylinderGeometry args={[0.18, 0.2, 0.24, 10]} />
          <GearMaterial color="#a89868" accent={accent} metalness={0.5} roughness={0.3} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.14, 0]} scale={[1.1, 0.5, 1.1]}>
          <sphereGeometry args={[0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <GearMaterial color="#c0b080" accent={accent} metalness={0.58} roughness={0.24} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.02, 0.15]} rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.1, 0.025, 6, 16, Math.PI]} />
          <GearMaterial color="#1a1410" roughness={0.95} nightBoost={nightBoost} />
        </mesh>
        {showGem && <RarityGem accent={accent} position={[0, 0.1, 0.17]} />}
      </group>
    );
  }

  if (v === 4) {
    return (
      <group position={[0, 1.68, 0]}>
        <mesh position={[0, 0.04, 0]} scale={[1.06, 0.76, 1.06]}>
          <sphereGeometry args={[0.17, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <GearMaterial color={metal.main} accent={accent} metalness={0.54} roughness={0.28} nightBoost={nightBoost} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.16, 0.1, 0]} rotation={[0, 0, side * 0.6]}>
            <mesh>
              <coneGeometry args={[0.05, 0.32, 6]} />
              <GearMaterial color={metal.trim} accent={accent} metalness={0.52} nightBoost={nightBoost} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <GearMaterial color={metal.dark} accent={accent} metalness={0.48} nightBoost={nightBoost} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (v === 5) {
    return (
      <group position={[0, 1.68, 0]}>
        <mesh position={[0, 0.06, 0]} scale={[1.14, 0.86, 1.14]}>
          <sphereGeometry args={[0.16, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <GearMaterial color="#dcc050" accent={accent} metalness={0.7} roughness={0.18} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.04, 0.02]} rotation={[0.14, 0, 0]}>
          <torusGeometry args={[0.17, 0.032, 8, 28]} />
          <GearMaterial color="#b09030" accent={accent} metalness={0.64} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.12, 0.1]}>
          <octahedronGeometry args={[0.04, 0]} />
          <GearMaterial color={accent} accent={accent} metalness={0.5} roughness={0.15} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 1.68, 0]}>
      <mesh position={[0, 0.04, 0]} scale={[1.06, 0.76, 1.06]}>
        <sphereGeometry args={[0.17, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <GearMaterial color={metal.main} accent={accent} metalness={0.52} roughness={0.3} nightBoost={nightBoost} />
      </mesh>
      <mesh position={[0, -0.02, 0.02]} rotation={[0.16, 0, 0]}>
        <torusGeometry args={[0.165, 0.026, 8, 28]} />
        <GearMaterial color={metal.trim} accent={accent} metalness={0.56} roughness={0.26} nightBoost={nightBoost} />
      </mesh>
      <mesh position={[0, 0.01, 0.14]} rotation={[0.4, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.14, 4, 10]} />
        <GearMaterial color={metal.dark} accent={accent} metalness={0.58} roughness={0.24} nightBoost={nightBoost} />
      </mesh>
      {showGem && <RarityGem accent={accent} position={[0, 0.1, 0.11]} />}
    </group>
  );
}

function HoodVariant({
  variant,
  accent,
  nightBoost,
  underHelmet,
}: {
  variant: number;
  accent: string;
  nightBoost: number;
  underHelmet: boolean;
}) {
  const v = ((variant % 6) + 6) % 6;
  const palette = FABRIC_PALETTES[v]!;

  if (underHelmet) {
    return (
      <group position={[0, 1.42, -0.02]}>
        <FabricPanel position={[0, -0.1, -0.08]} rotation={[0.32, 0, 0]} size={[0.46, 0.28, 0.1]} color={palette.lining} accent={accent} nightBoost={nightBoost} />
        {[-1, 1].map((side) => (
          <FabricPanel
            key={side}
            position={[side * 0.24, -0.02, -0.03]}
            rotation={[0.14, side * 0.32, side * 0.1]}
            size={[0.12, 0.38, 0.06]}
            color={palette.main}
            accent={accent}
            nightBoost={nightBoost}
          />
        ))}
      </group>
    );
  }

  if (v === 1) {
    return (
      <group position={[0, 1.66, -0.02]}>
        <mesh position={[0, 0.18, 0.02]} rotation={[-0.08, 0, 0]}>
          <coneGeometry args={[0.16, 0.46, 14, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.78} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.04, 0.02]}>
          <sphereGeometry args={[0.18, 16, 14]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.84} nightBoost={nightBoost} />
        </mesh>
        <FabricPanel position={[0, -0.12, -0.1]} rotation={[0.3, 0, 0]} size={[0.42, 0.22, 0.1]} color={palette.trim} accent={accent} nightBoost={nightBoost} />
        <RarityGem accent={accent} position={[0, 0.06, 0.15]} scale={0.9} />
      </group>
    );
  }

  if (v === 2) {
    return (
      <group position={[0, 1.64, -0.02]}>
        <mesh position={[0, 0.06, 0.02]} rotation={[-0.25, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.26, 0.16, 16, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.82} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.06, -0.02]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.2, 0.04, 8, 24, Math.PI]} />
          <GearMaterial color={palette.trim} accent={accent} roughness={0.88} nightBoost={nightBoost} />
        </mesh>
        {[-1, 1].map((side) => (
          <FabricPanel key={side} position={[side * 0.22, -0.1, -0.06]} rotation={[0.2, side * 0.25, 0]} size={[0.1, 0.3, 0.06]} color={palette.lining} accent={accent} nightBoost={nightBoost} />
        ))}
      </group>
    );
  }

  if (v === 3) {
    return (
      <group position={[0, 1.65, -0.02]}>
        <mesh position={[0, 0.08, 0]} rotation={[-0.12, 0, 0]}>
          <sphereGeometry args={[0.2, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.02, -0.04]} rotation={[0.25, 0, 0]}>
          <coneGeometry args={[0.28, 0.5, 4, 1, true]} />
          <GearMaterial color={palette.trim} accent={accent} roughness={0.86} nightBoost={nightBoost} opacity={0.95} />
        </mesh>
      </group>
    );
  }

  if (v === 4) {
    return (
      <group position={[0, 1.66, -0.02]}>
        <mesh position={[0, 0.04, 0.04]} rotation={[-0.1, 0, 0]}>
          <coneGeometry args={[0.24, 0.4, 16, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.76} metalness={0.06} nightBoost={nightBoost} opacity={0.96} />
        </mesh>
        <FabricPanel position={[0, -0.14, -0.12]} rotation={[0.34, 0, 0]} size={[0.5, 0.3, 0.08]} color={palette.lining} accent={accent} nightBoost={nightBoost} />
        <FabricPanel position={[-0.12, -0.08, -0.08]} rotation={[0.2, 0.2, 0.15]} size={[0.14, 0.24, 0.05]} color={palette.trim} accent={accent} nightBoost={nightBoost} />
        <FabricPanel position={[0.1, -0.1, -0.1]} rotation={[0.25, -0.15, -0.1]} size={[0.12, 0.2, 0.05]} color={palette.main} accent={accent} nightBoost={nightBoost} />
      </group>
    );
  }

  if (v === 5) {
    return (
      <group position={[0, 1.66, -0.02]}>
        <mesh position={[0, 0.1, 0.02]} rotation={[-0.15, 0, 0]}>
          <coneGeometry args={[0.14, 0.32, 10, 1, true]} />
          <GearMaterial color={palette.trim} accent={accent} roughness={0.74} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.02, 0.02]}>
          <sphereGeometry args={[0.17, 14, 12]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.84} nightBoost={nightBoost} />
        </mesh>
        {[-1, 1].map((side) => (
          <FabricPanel key={side} position={[side * 0.2, -0.08, -0.05]} rotation={[0.22, side * 0.3, side * 0.08]} size={[0.14, 0.32, 0.05]} color={palette.lining} accent={accent} nightBoost={nightBoost} />
        ))}
        <RarityTrim accent={accent} position={[0, 0, 0.12]} rotation={[0.55, 0, 0]} radius={0.14} />
      </group>
    );
  }

  return (
    <group position={[0, 1.66, -0.02]}>
      <mesh position={[0, 0.04, 0.04]} rotation={[-0.1, 0, 0]}>
        <coneGeometry args={[0.2, 0.36, 14, 1, true]} />
        <GearMaterial color={palette.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
      </mesh>
      <mesh position={[0, -0.06, 0.02]}>
        <sphereGeometry args={[0.17, 14, 12]} />
        <GearMaterial color={palette.main} accent={accent} roughness={0.86} nightBoost={nightBoost} />
      </mesh>
      <FabricPanel position={[0, -0.12, -0.1]} rotation={[0.3, 0, 0]} size={[0.38, 0.22, 0.08]} color={palette.trim} accent={accent} nightBoost={nightBoost} />
    </group>
  );
}

function CloakVariant({
  variant,
  accent,
  rarity,
  nightBoost,
}: {
  variant: number;
  accent: string;
  rarity: GearRarity;
  nightBoost: number;
}) {
  const v = ((variant % 6) + 6) % 6;
  const palette = FABRIC_PALETTES[v]!;

  if (v === 1) {
    return (
      <group position={[0, 1.22, -0.14]}>
        <mesh position={[0, -0.22, -0.08]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.38, 0.78, 4, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.84} nightBoost={nightBoost} opacity={0.94} />
        </mesh>
        {[-1, 1].map((side) => (
          <FabricPanel key={side} position={[side * 0.22, 0.04, 0]} rotation={[0.12, side * 0.4, side * 0.12]} size={[0.14, 0.32, 0.05]} color={palette.trim} accent={accent} nightBoost={nightBoost} />
        ))}
        <mesh position={[0, 0.1, 0.02]}>
          <torusGeometry args={[0.2, 0.03, 6, 20, Math.PI]} />
          <GearMaterial color={palette.lining} accent={accent} roughness={0.9} nightBoost={nightBoost} />
        </mesh>
        {rarity === 'epic' && <RarityGem accent={accent} position={[0, 0.22, 0.06]} />}
      </group>
    );
  }

  if (v === 2) {
    return (
      <group position={[0, 1.28, -0.1]}>
        <mesh position={[0, -0.08, -0.06]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.36, 0.58, 6, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.82} nightBoost={nightBoost} opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.12, 0.02]} rotation={[-0.2, 0, 0]}>
          <sphereGeometry args={[0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <GearMaterial color={palette.trim} accent={accent} roughness={0.86} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 3) {
    return (
      <group position={[0, 1.3, -0.12]}>
        <mesh position={[0, 0.08, 0.02]} rotation={[-0.18, 0, 0]}>
          <coneGeometry args={[0.22, 0.3, 12, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
        </mesh>
        {[-1, 1].map((side) => (
          <FabricPanel key={side} position={[side * 0.16, -0.14, -0.06]} rotation={[0.18, side * 0.22, side * 0.08]} size={[0.18, 0.52, 0.04]} color={palette.trim} accent={accent} nightBoost={nightBoost} />
        ))}
        <FabricPanel position={[0, 0.02, 0.01]} size={[0.34, 0.1, 0.12]} color={palette.lining} accent={accent} nightBoost={nightBoost} />
      </group>
    );
  }

  if (v === 4) {
    return (
      <group position={[0, 1.2, -0.12]}>
        <FabricPanel position={[-0.1, -0.18, -0.06]} rotation={[0.22, 0.18, 0.12]} size={[0.28, 0.54, 0.04]} color={palette.main} accent={accent} nightBoost={nightBoost} />
        <FabricPanel position={[0.12, -0.24, -0.07]} rotation={[0.3, -0.12, -0.08]} size={[0.22, 0.44, 0.04]} color={palette.trim} accent={accent} nightBoost={nightBoost} />
        <FabricPanel position={[0.02, -0.08, -0.04]} rotation={[0.15, -0.05, 0.05]} size={[0.16, 0.36, 0.04]} color={palette.lining} accent={accent} nightBoost={nightBoost} />
      </group>
    );
  }

  if (v === 5) {
    return (
      <group position={[0, 1.24, -0.13]}>
        <mesh position={[0, -0.14, -0.06]} rotation={[0.16, 0, 0]}>
          <coneGeometry args={[0.34, 0.72, 5, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.84} metalness={0.08} nightBoost={nightBoost} opacity={0.93} />
        </mesh>
        <RarityTrim accent={accent} position={[0, 0.16, 0.02]} rotation={[1.25, 0, 0]} radius={0.2} />
        {rarity === 'epic' && <RarityGem accent={accent} position={[0, 0.24, 0.04]} scale={1.3} />}
      </group>
    );
  }

  return (
    <group position={[0, 1.24, -0.12]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.2, -0.12, -0.05]} rotation={[0.18, side * 0.25, side * 0.1]}>
          <coneGeometry args={[0.14, 0.58, 3, 1, true]} />
          <GearMaterial color={palette.main} accent={accent} roughness={0.86} nightBoost={nightBoost} opacity={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.06, 0.01]}>
        <cylinderGeometry args={[0.2, 0.24, 0.1, 10]} />
        <GearMaterial color={palette.trim} accent={accent} roughness={0.88} nightBoost={nightBoost} />
      </mesh>
      <RarityGem accent={accent} position={[0, 0.1, 0.06]} scale={0.85} />
    </group>
  );
}

function BeltVariant({
  variant,
  accent,
  rarity,
  nightBoost,
}: {
  variant: number;
  accent: string;
  rarity: GearRarity;
  nightBoost: number;
}) {
  const v = ((variant % 6) + 6) % 6;
  const leather = LEATHER_PALETTES[v]!;

  if (v === 1) {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.035, 8, 24]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.78} nightBoost={nightBoost} />
        </mesh>
        {[-0.14, 0, 0.14].map((x, i) => (
          <mesh key={i} position={[x, 0.02, 0.1]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
            <GearMaterial color="#9098a0" accent={accent} metalness={0.58} roughness={0.28} nightBoost={nightBoost} />
          </mesh>
        ))}
      </group>
    );
  }

  if (v === 2) {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 1, 0.85]}>
          <torusGeometry args={[0.18, 0.04, 8, 28]} />
          <GearMaterial color="#d8b848" accent={accent} metalness={0.48} roughness={0.32} nightBoost={nightBoost} />
        </mesh>
        <MetalBuckle position={[0, 0, 0.12]} accent={accent} nightBoost={nightBoost} size={0.1} />
        <RarityGem accent={accent} position={[0, 0.03, 0.16]} />
      </group>
    );
  }

  if (v === 3) {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.022, 8, 32]} />
          <GearMaterial color="#889098" accent={accent} metalness={0.64} roughness={0.24} nightBoost={nightBoost} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.17, -0.05, 0.08]} rotation={[0.25, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.06, 10, 10]} />
              <GearMaterial color={leather.trim} accent={accent} roughness={0.84} nightBoost={nightBoost} />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <coneGeometry args={[0.05, 0.1, 8]} />
              <GearMaterial color={leather.main} accent={accent} roughness={0.86} nightBoost={nightBoost} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (v === 4) {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.17, 0.032, 8, 24]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <octahedronGeometry args={[0.045, 0]} />
          <GearMaterial color={accent} accent={accent} metalness={0.45} roughness={0.2} nightBoost={nightBoost} />
        </mesh>
        <RarityTrim accent={accent} position={[0, 0, 0.02]} rotation={[1.57, 0, 0]} radius={0.17} />
      </group>
    );
  }

  if (v === 5) {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.18, 0.028, 8, 24]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.82} nightBoost={nightBoost} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <torusGeometry args={[0.17, 0.022, 8, 24]} />
          <GearMaterial color={leather.trim} accent={accent} roughness={0.86} nightBoost={nightBoost} />
        </mesh>
        {rarity === 'epic' && (
          <>
            <RarityGem accent={accent} position={[-0.12, 0, 0.12]} />
            <RarityGem accent={accent} position={[0.12, 0, 0.12]} />
          </>
        )}
      </group>
    );
  }

  return (
    <group position={[0, 0.9, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 8, 24]} />
        <GearMaterial color={leather.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
      </mesh>
      <MetalBuckle position={[0, 0, 0.12]} accent={accent} nightBoost={nightBoost} />
    </group>
  );
}

function GloveSide({
  side,
  variant,
  accent,
  nightBoost,
}: {
  side: -1 | 1;
  variant: number;
  accent: string;
  nightBoost: number;
}) {
  const v = ((variant % 6) + 6) % 6;
  const leather = LEATHER_PALETTES[v]!;
  const x = side * 0.42;
  const z = 0.03;
  const rot: Vec3 = [0.15, 0, side * -0.25];

  if (v === 1) {
    return (
      <group position={[x, 0.9, z]} rotation={rot}>
        <mesh position={[0, 0.02, 0]}>
          <capsuleGeometry args={[0.055, 0.16, 5, 10]} />
          <GearMaterial color="#949ca4" accent={accent} metalness={0.6} roughness={0.26} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.1, 0.02]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <GearMaterial color="#6a7078" accent={accent} metalness={0.54} nightBoost={nightBoost} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, -0.04 - i * 0.03, 0.05]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.022, 0.04, 4, 6]} />
            <GearMaterial color="#b0b8c0" accent={accent} metalness={0.62} roughness={0.2} nightBoost={nightBoost} />
          </mesh>
        ))}
      </group>
    );
  }

  if (v === 2) {
    const silk = accent === '#5fe85f' ? '#4a6850' : '#4a5068';
    return (
      <group position={[x, 0.9, z]} rotation={rot}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.048, 0.062, 0.14, 12]} />
          <GearMaterial color={silk} accent={accent} roughness={0.38} metalness={0.18} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.055, 0.012, 6, 16]} />
          <GearMaterial color={accent} accent={accent} metalness={0.4} roughness={0.25} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 3) {
    return (
      <group position={[x, 0.9, z]} rotation={rot}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.76} nightBoost={nightBoost} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.02 - i * 0.02, 0.065]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.014, 0.05, 5]} />
            <GearMaterial color="#a8b0b8" accent={accent} metalness={0.68} roughness={0.18} nightBoost={nightBoost} />
          </mesh>
        ))}
        <mesh position={[0, -0.08, 0.01]}>
          <capsuleGeometry args={[0.04, 0.08, 4, 8]} />
          <GearMaterial color={leather.trim} accent={accent} roughness={0.82} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 4) {
    return (
      <group position={[x, 0.9, z]} rotation={rot}>
        <mesh position={[0, -0.02, 0]}>
          <capsuleGeometry args={[0.045, 0.1, 5, 8]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.04, 0.02]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <GearMaterial color={leather.trim} accent={accent} roughness={0.84} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 5) {
    return (
      <group position={[x, 0.9, z]} rotation={rot}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.86} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, -0.08, 0.02]} scale={[1, 0.6, 1.2]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <GearMaterial color={leather.trim} accent={accent} roughness={0.88} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, 0.9, z]} rotation={rot}>
      <mesh position={[0, 0.02, 0]}>
        <capsuleGeometry args={[0.045, 0.12, 5, 8]} />
        <GearMaterial color={leather.main} accent={accent} roughness={0.78} nightBoost={nightBoost} />
      </mesh>
      <mesh position={[0, -0.08, 0.02]}>
        <sphereGeometry args={[0.048, 10, 10]} />
        <GearMaterial color={leather.trim} accent={accent} roughness={0.84} nightBoost={nightBoost} />
      </mesh>
    </group>
  );
}

function GlovesVariant({ variant, accent, nightBoost }: { variant: number; accent: string; nightBoost: number }) {
  return (
    <>
      <GloveSide side={-1} variant={variant} accent={accent} nightBoost={nightBoost} />
      <GloveSide side={1} variant={variant} accent={accent} nightBoost={nightBoost} />
    </>
  );
}

function BootSide({
  side,
  variant,
  accent,
  nightBoost,
}: {
  side: -1 | 1;
  variant: number;
  accent: string;
  nightBoost: number;
}) {
  const v = ((variant % 6) + 6) % 6;
  const leather = LEATHER_PALETTES[v]!;
  const x = side * 0.12;

  if (v === 1) {
    return (
      <group position={[x, 0.1, 0.02]}>
        <mesh position={[0, 0.1, 0]}>
          <capsuleGeometry args={[0.055, 0.2, 5, 10]} />
          <GearMaterial color="#949ca4" accent={accent} metalness={0.56} roughness={0.28} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.02, 0.06]} scale={[1.1, 0.5, 1.3]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <GearMaterial color="#6a7078" accent={accent} metalness={0.5} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 2) {
    return (
      <group position={[x, 0.08, 0.02]}>
        <mesh position={[0, 0.03, 0.02]} scale={[1.2, 0.35, 1.4]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <GearMaterial color="#7a6858" accent={accent} roughness={0.68} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.01, -0.02]}>
          <torusGeometry args={[0.07, 0.015, 6, 14, Math.PI]} />
          <GearMaterial color="#9a8878" accent={accent} roughness={0.72} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 3) {
    return (
      <group position={[x, 0.1, 0.02]}>
        <mesh position={[0, 0.12, 0]}>
          <capsuleGeometry args={[0.06, 0.22, 6, 10]} />
          <GearMaterial color="#808890" accent={accent} metalness={0.6} roughness={0.26} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.02, 0.08]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.07, 0.12, 6]} />
          <GearMaterial color="#5a6068" accent={accent} metalness={0.54} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 4) {
    return (
      <group position={[x, 0.1, 0.02]}>
        <mesh position={[0, 0.08, 0]}>
          <capsuleGeometry args={[0.052, 0.18, 5, 10]} />
          <GearMaterial color={leather.main} accent={accent} roughness={0.8} nightBoost={nightBoost} />
        </mesh>
        <mesh position={[0, 0.16, -0.02]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.06, 0.02, 6, 12, Math.PI]} />
          <GearMaterial color="#d8d0c0" accent={accent} roughness={0.88} nightBoost={nightBoost} />
        </mesh>
      </group>
    );
  }

  if (v === 5) {
    return (
      <group position={[x, 0.1, 0.02]}>
        <mesh position={[0, 0.06, 0]}>
          <capsuleGeometry args={[0.048, 0.14, 5, 8]} />
          <GearMaterial color={leather.trim} accent={accent} roughness={0.74} nightBoost={nightBoost} />
        </mesh>
        <RarityTrim accent={accent} position={[0, 0.13, 0.02]} rotation={[1.2, 0, 0]} radius={0.055} />
      </group>
    );
  }

  return (
    <group position={[x, 0.1, 0.02]}>
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.052, 0.18, 5, 10]} />
        <GearMaterial color={leather.main} accent={accent} roughness={0.78} nightBoost={nightBoost} />
      </mesh>
      <mesh position={[0, 0.02, 0.05]} scale={[1.1, 0.45, 1.2]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <GearMaterial color={leather.trim} accent={accent} roughness={0.82} nightBoost={nightBoost} />
      </mesh>
    </group>
  );
}

function BootsVariant({ variant, accent, nightBoost }: { variant: number; accent: string; nightBoost: number }) {
  return (
    <>
      <BootSide side={-1} variant={variant} accent={accent} nightBoost={nightBoost} />
      <BootSide side={1} variant={variant} accent={accent} nightBoost={nightBoost} />
    </>
  );
}

export function GearModel({
  kind,
  variant = 0,
  rarity = 'common',
  nightBoost = 0,
  hoodUnderHelmet = false,
}: GearModelProps) {
  const accent = RARITY_ACCENT[rarity];

  switch (kind) {
    case 'helmet':
      return <HelmetVariant variant={variant} accent={accent} rarity={rarity} nightBoost={nightBoost} />;
    case 'hood':
      return <HoodVariant variant={variant} accent={accent} nightBoost={nightBoost} underHelmet={hoodUnderHelmet} />;
    case 'cloak':
      return <CloakVariant variant={variant} accent={accent} rarity={rarity} nightBoost={nightBoost} />;
    case 'belt':
      return <BeltVariant variant={variant} accent={accent} rarity={rarity} nightBoost={nightBoost} />;
    case 'gloves':
      return <GlovesVariant variant={variant} accent={accent} nightBoost={nightBoost} />;
    case 'boots':
      return <BootsVariant variant={variant} accent={accent} nightBoost={nightBoost} />;
  }
}
