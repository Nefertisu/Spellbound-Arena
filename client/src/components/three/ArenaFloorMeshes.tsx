import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, InstancedMesh, Matrix4, Object3D } from 'three';
import * as THREE from 'three';
import { ARENA_LAVA_RING_WIDTH, CRYSTAL_INNER_VOID_RATIO, CRYSTAL_PLATFORM_INSET, CRYSTAL_WEDGE_GAP, getArenaMap, type ArenaMapId, type CorruptedPlatformPatch } from '@spellbound/shared';
import type { Group } from 'three';
import { generateCrystalRiftDecor, type CrystalDecorPlacement } from './crystalRiftDecor';

interface ArenaFloorMeshesProps {
  mapId: ArenaMapId;
  radius: number;
  nightFactor?: number;
  preview?: boolean;
  corruptedPatches?: readonly CorruptedPlatformPatch[];
}

function LavaPitFloor({
  radius,
  nightFactor,
  preview,
}: {
  radius: number;
  nightFactor: number;
  preview?: boolean;
}) {
  const theme = getArenaMap('lava_pit').theme;
  const floorEmissive = 0.12 + nightFactor * 0.28;
  const floorColor = nightFactor > 0.4 ? theme.floorColorNight : theme.floorColorDay;
  const hazardOuter = preview ? radius + ARENA_LAVA_RING_WIDTH * 0.35 : radius + ARENA_LAVA_RING_WIDTH;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial
          color={floorColor}
          emissive={theme.floorEmissive}
          emissiveIntensity={floorEmissive}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[radius, hazardOuter, 64]} />
        <meshStandardMaterial
          color={theme.hazardColor}
          emissive={theme.hazardEmissive}
          emissiveIntensity={0.9 + nightFactor * 0.3}
          roughness={0.4}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[preview ? 120 : 240, preview ? 120 : 240]} />
        <meshStandardMaterial color={theme.groundPlaneColor} roughness={1} />
      </mesh>
    </group>
  );
}

const SHARED_SHARD_GEO = new THREE.OctahedronGeometry(1, 0);
const SHARED_STATIC_GEO = new THREE.OctahedronGeometry(1, 0);
const STATIC_CRYSTAL_DUMMY = new Object3D();
const STATIC_CRYSTAL_MATRIX = new Matrix4();
const STATIC_CRYSTAL_COLOR = new Color();

function FloatingShard({
  placement,
}: {
  placement: CrystalDecorPlacement;
}) {
  const ref = useRef<Group>(null);
  const baseY = placement.y;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = placement.rotation[1] + state.clock.elapsedTime * placement.spin;
    ref.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.4 + placement.x) * 0.25;
  });

  return (
    <group
      ref={ref}
      position={[placement.x, placement.y, placement.z]}
      rotation={placement.rotation}
      scale={placement.scale}
    >
      <mesh geometry={SHARED_SHARD_GEO}>
        <meshStandardMaterial
          color={placement.color}
          emissive={placement.color}
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.55}
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
}

function InstancedStaticCrystals({ placements }: { placements: CrystalDecorPlacement[] }) {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || placements.length === 0) return;

    placements.forEach((placement, index) => {
      STATIC_CRYSTAL_DUMMY.position.set(placement.x, placement.y, placement.z);
      STATIC_CRYSTAL_DUMMY.rotation.set(...placement.rotation);
      STATIC_CRYSTAL_DUMMY.scale.setScalar(placement.scale);
      STATIC_CRYSTAL_DUMMY.updateMatrix();
      mesh.setMatrixAt(index, STATIC_CRYSTAL_DUMMY.matrix);
      STATIC_CRYSTAL_COLOR.set(placement.color);
      mesh.setColorAt(index, STATIC_CRYSTAL_COLOR);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [placements]);

  if (placements.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[SHARED_STATIC_GEO, undefined, placements.length]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={0.85}
        roughness={0.18}
        metalness={0.5}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
}

function CrystalRiftFloor({
  radius,
  nightFactor,
  preview,
  corruptedPatches = [],
}: {
  radius: number;
  nightFactor: number;
  preview?: boolean;
  corruptedPatches?: readonly CorruptedPlatformPatch[];
}) {
  const theme = getArenaMap('crystal_rift').theme;
  const scale = preview ? radius / 20 : 1;
  const r = preview ? 20 : radius;
  const innerVoid = r * CRYSTAL_INNER_VOID_RATIO;
  const wedgeGap = CRYSTAL_WEDGE_GAP;

  const crystals = useMemo(
    () => generateCrystalRiftDecor(r, preview ?? false),
    [preview, r],
  );

  const animatedCrystals = useMemo(
    () => crystals.filter((crystal) => crystal.animated),
    [crystals],
  );

  const staticCrystals = useMemo(
    () => crystals.filter((crystal) => !crystal.animated),
    [crystals],
  );

  const wedges = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        thetaStart: i * (Math.PI / 2) + wedgeGap,
        thetaLength: Math.PI / 2 - wedgeGap * 2,
      })),
    [],
  );

  return (
    <group scale={preview ? [scale, scale, scale] : [1, 1, 1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <planeGeometry args={[preview ? 120 : 260, preview ? 120 : 260]} />
        <meshStandardMaterial
          color="#05020f"
          emissive="#180830"
          emissiveIntensity={0.65 + nightFactor * 0.35}
          roughness={1}
        />
      </mesh>

      {animatedCrystals.map((crystal) => (
        <FloatingShard key={crystal.id} placement={crystal} />
      ))}

      {staticCrystals.length > 0 && (
        <InstancedStaticCrystals placements={staticCrystals} />
      )}

      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[innerVoid, innerVoid * 1.05, 3.5, 6, 1, true]} />
        <meshStandardMaterial
          color="#060018"
          emissive="#7020d0"
          emissiveIntensity={1.1 + nightFactor * 0.5}
          roughness={0.2}
          metalness={0.4}
          side={DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerVoid + 0.4, innerVoid + 1.8, 48]} />
        <meshBasicMaterial color="#80f0ff" transparent opacity={0.55} />
      </mesh>

      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.35, 0.15, 12, 6]} />
        <meshStandardMaterial
          color="#90f8ff"
          emissive="#40c8ff"
          emissiveIntensity={1.8}
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.75}
        />
      </mesh>

      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        const dist = 0.55 + (i % 2) * 0.25;
        return (
          <mesh
            key={`spire-${i}`}
            position={[Math.cos(angle) * dist, 0.35 + (i % 3) * 0.4, Math.sin(angle) * dist]}
            rotation={[0.12, angle, 0.08]}
            scale={[0.22, 0.55 + (i % 2) * 0.2, 0.22]}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#70e8ff' : '#b080ff'}
              emissive={i % 2 === 0 ? '#40c8ff' : '#9050ff'}
              emissiveIntensity={1.5}
              roughness={0.12}
              metalness={0.55}
              transparent
              opacity={0.82}
            />
          </mesh>
        );
      })}

      {wedges.map((wedge, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
            <ringGeometry args={[innerVoid + CRYSTAL_PLATFORM_INSET, r, 40, 1, wedge.thetaStart, wedge.thetaLength]} />
            <meshStandardMaterial
              color={nightFactor > 0.4 ? '#1a2858' : '#142040'}
              emissive="#103060"
              emissiveIntensity={0.45 + nightFactor * 0.25}
              roughness={0.35}
              metalness={0.55}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry
              args={[innerVoid + 1.15, r - 0.2, 40, 1, wedge.thetaStart + 0.04, wedge.thetaLength - 0.08]}
            />
            <meshBasicMaterial color="#50e8ff" transparent opacity={0.28} />
          </mesh>
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <ringGeometry args={[r, r + (preview ? 12 : ARENA_LAVA_RING_WIDTH * 0.65), 64]} />
        <meshStandardMaterial
          color="#120828"
          emissive="#9040ff"
          emissiveIntensity={1.2 + nightFactor * 0.4}
          roughness={0.25}
          metalness={0.35}
        />
      </mesh>

      <pointLight position={[0, 8, 0]} intensity={1.4} color="#60f0ff" distance={preview ? 40 : 70} />
      <pointLight position={[0, 2, 0]} intensity={0.9} color="#c060ff" distance={preview ? 30 : 50} />
      <pointLight position={[0, -3, 0]} intensity={0.6 + nightFactor * 0.4} color="#4020a0" distance={35} />

      {corruptedPatches.map((patch, index) => (
        <group key={`${patch.x}-${patch.z}-${index}`} position={[patch.x, 0, patch.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <circleGeometry args={[patch.radius, 32]} />
            <meshStandardMaterial
              color={theme.hazardColor}
              emissive={theme.hazardEmissive}
              emissiveIntensity={1.35 + nightFactor * 0.35}
              roughness={0.25}
              metalness={0.2}
              transparent
              opacity={0.92}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <ringGeometry args={[patch.radius * 0.72, patch.radius, 32]} />
            <meshBasicMaterial color={theme.accentEmissive} transparent opacity={0.45} />
          </mesh>
          <pointLight
            position={[0, 1.5, 0]}
            intensity={0.7}
            color={theme.hazardEmissive}
            distance={patch.radius * 2.2}
          />
        </group>
      ))}
    </group>
  );
}

export function ArenaFloorMeshes({
  mapId,
  radius,
  nightFactor = 0,
  preview = false,
  corruptedPatches = [],
}: ArenaFloorMeshesProps) {
  if (mapId === 'crystal_rift') {
    return (
      <CrystalRiftFloor
        radius={radius}
        nightFactor={nightFactor}
        preview={preview}
        corruptedPatches={corruptedPatches}
      />
    );
  }

  return <LavaPitFloor radius={radius} nightFactor={nightFactor} preview={preview} />;
}
