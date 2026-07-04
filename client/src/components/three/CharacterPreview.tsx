import { Canvas, useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import type { Character, CharacterStats, GearKind, ShopGear } from '@spellbound/shared';
import { sortEquippedGear, sortGearKinds } from '@spellbound/shared';
import { CustomAvatarModel } from './CustomAvatarModel';
import { GearOverlay } from './GearOverlay';
import { MannequinModel } from './MannequinModel';
import styles from './CharacterPreview.module.scss';

const SIZE_CONFIG: Record<
  CharacterPreviewSize,
  {
    camera: [number, number, number];
    fov: number;
    scale: number;
    offsetY: number;
    lookAt?: readonly [number, number, number];
  }
> = {
  slot: { camera: [0, 1.05, 2.6], fov: 42, scale: 0.72, offsetY: -0.55 },
  default: { camera: [0, 1.2, 3.2], fov: 40, scale: 1, offsetY: -0.8 },
  hero: { camera: [0, 1.25, 3.5], fov: 38, scale: 1.1, offsetY: -0.85 },
  full: { camera: [0, 1.3, 3.8], fov: 36, scale: 1.2, offsetY: -0.9 },
  stage: { camera: [0, 1.32, 5.6], fov: 38, scale: 1.18, offsetY: -0.62, lookAt: [0, 0.92, 0] as const },
  lobby: { camera: [0, 1.18, 2.9], fov: 38, scale: 1, offsetY: -0.78, lookAt: [0, 1.2, 0] as const },
};

function PreviewCamera({ target }: { target?: readonly [number, number, number] }) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (!target) return;
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, target]);

  return null;
}

function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.75} color="#f0f0f4" />
      <directionalLight position={[4, 8, 5]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-4, 5, -3]} intensity={0.45} color="#d8dce8" />
      <directionalLight position={[0, 2, -6]} intensity={0.25} color="#ffffff" />
    </>
  );
}

export type CharacterPreviewSize = 'slot' | 'default' | 'hero' | 'full' | 'stage' | 'lobby';

export type CharacterPreviewBody = 'mannequin' | 'custom';

interface CharacterPreviewProps {
  character?: Character | null;
  stats?: CharacterStats;
  isBot?: boolean;
  empty?: boolean;
  size?: CharacterPreviewSize;
  colorizeByStats?: boolean;
  frameless?: boolean;
  headGear?: GearKind | null;
  equippedGearKinds?: GearKind[];
  equippedGear?: ShopGear[];
  bodyMode?: CharacterPreviewBody;
  customModelUrl?: string | null;
  customModelScale?: number;
  className?: string;
  onClick?: () => void;
}

export function CharacterPreview({
  character,
  stats,
  isBot,
  empty,
  size = 'default',
  colorizeByStats = false,
  frameless = false,
  headGear = null,
  equippedGearKinds,
  equippedGear,
  bodyMode = 'mannequin',
  customModelUrl = null,
  customModelScale = 1,
  className = '',
  onClick,
}: CharacterPreviewProps) {
  const resolvedStats = stats ?? character?.stats;
  const sizeClass = styles[size] ?? styles.default;
  const config = SIZE_CONFIG[size] ?? SIZE_CONFIG.default;
  const framelessClass = frameless ? styles.frameless : '';

  if (empty || !resolvedStats) {
    return (
      <div
        className={`${styles.preview} ${styles.empty} ${sizeClass} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      >
        <div className={styles.placeholder}>
          <span>+</span>
          <p>Empty Slot</p>
        </div>
      </div>
    );
  }

  const sortedGear = equippedGear ? sortEquippedGear(equippedGear) : undefined;
  const useCustomBody = bodyMode === 'custom' && customModelUrl;

  return (
    <div className={`${styles.preview} ${sizeClass} ${framelessClass} ${className}`}>
      <Canvas
        camera={{ position: config.camera, fov: config.fov, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <PreviewCamera target={config.lookAt} />
        <StudioLighting />
        {useCustomBody ? (
          <>
            <CustomAvatarModel
              url={customModelUrl}
              scale={config.scale}
              modelScale={customModelScale}
              offsetY={config.offsetY}
              animate={size !== 'slot'}
              rotateSlowly={size !== 'slot'}
              showShadow={!frameless}
            />
            {sortedGear && sortedGear.length > 0 && <GearOverlay equippedGear={sortedGear} />}
          </>
        ) : (
          <MannequinModel
            stats={resolvedStats}
            isBot={isBot}
            colorizeByStats={colorizeByStats}
            scale={config.scale}
            offsetY={config.offsetY}
            animate={size !== 'slot'}
            rotateSlowly={size !== 'slot'}
            showShadow={!frameless}
            headGear={headGear}
            equippedGear={sortedGear}
            equippedGearKinds={
              sortedGear
                ? undefined
                : equippedGearKinds
                  ? sortGearKinds(equippedGearKinds)
                  : undefined
            }
          />
        )}
      </Canvas>
    </div>
  );
}
