import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import type { Group, Object3D } from 'three';
import { Box3, Vector3 } from 'three';

const TARGET_HEIGHT = 1.75;

export interface CustomAvatarModelProps {
  url: string;
  animate?: boolean;
  feetOnGround?: boolean;
  offsetY?: number;
  scale?: number;
  modelScale?: number;
  showShadow?: boolean;
  rotateSlowly?: boolean;
}

function normalizeScene(scene: Object3D, modelScale: number) {
  const clone = scene.clone(true);
  const box = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);

  const height = Math.max(size.y, 0.001);
  const fitScale = (TARGET_HEIGHT / height) * modelScale;

  clone.position.x -= center.x;
  clone.position.z -= center.z;
  clone.position.y -= box.min.y;

  return { clone, fitScale };
}

export function CustomAvatarModel({
  url,
  animate = true,
  feetOnGround = false,
  offsetY = 0,
  scale = 1,
  modelScale = 1,
  showShadow = false,
  rotateSlowly = false,
}: CustomAvatarModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(url);

  const normalized = useMemo(() => normalizeScene(scene, modelScale), [scene, modelScale]);

  useLayoutEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (rotateSlowly) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }

    const baseY = feetOnGround ? 0 : offsetY;
    if (animate) {
      groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.2) * 0.02;
    } else {
      groupRef.current.position.y = baseY;
    }
  });

  const rootY = feetOnGround ? 0 : offsetY;

  return (
    <group ref={groupRef} position={[0, rootY, 0]} scale={scale}>
      {showShadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.42, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.32} />
        </mesh>
      )}

      <group scale={normalized.fitScale}>
        <primitive object={normalized.clone} />
      </group>
    </group>
  );
}
