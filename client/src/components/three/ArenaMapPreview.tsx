import { useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { getArenaMap, type ArenaMapId } from '@spellbound/shared';
import { ArenaFloorMeshes } from './ArenaFloorMeshes';
import { ObstacleModel } from './CharacterModel';
import styles from './ArenaMapPreview.module.scss';

function PreviewCamera() {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(0, 24, 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function ArenaMapScene({ mapId }: { mapId: ArenaMapId }) {
  const map = getArenaMap(mapId);
  const obstacleVariant = mapId === 'crystal_rift' ? 'crystal' : 'default';
  const isCrystal = mapId === 'crystal_rift';

  return (
    <>
      <color attach="background" args={[isCrystal ? '#0a0820' : '#0a0810']} />
      <fog attach="fog" args={[isCrystal ? '#120828' : '#0a0810', 20, 70]} />
      <ambientLight intensity={0.55} color={isCrystal ? '#c0d8ff' : '#e8e8f0'} />
      <directionalLight position={[8, 16, 10]} intensity={1.1} color="#ffffff" />
      <directionalLight
        position={[-6, 8, -4]}
        intensity={0.45}
        color={isCrystal ? '#80b0ff' : '#a0c8ff'}
      />
      <PreviewCamera />
      <ArenaFloorMeshes mapId={mapId} radius={20} preview />
      {map.obstacles.map((obstacle, index) => (
        <group key={index} position={[obstacle.x, 0, obstacle.z]}>
          <ObstacleModel type={obstacle.type} hpRatio={1} variant={obstacleVariant} />
        </group>
      ))}
    </>
  );
}

interface ArenaMapPreviewProps {
  mapId: ArenaMapId;
  className?: string;
}

export function ArenaMapPreview({ mapId, className = '' }: ArenaMapPreviewProps) {
  const map = getArenaMap(mapId);

  return (
    <div className={`${styles.preview} ${className}`}>
      <div className={styles.canvasWrap}>
        <Canvas camera={{ position: [0, 24, 20], fov: 42 }} gl={{ antialias: true }}>
          <ArenaMapScene mapId={mapId} />
        </Canvas>
      </div>
      <div className={styles.meta}>
        <span className={`${styles.mapName} ${styles[mapId]}`}>{map.name}</span>
        <span className={styles.vs}>VS</span>
        <p className={styles.description}>{map.description}</p>
      </div>
    </div>
  );
}
