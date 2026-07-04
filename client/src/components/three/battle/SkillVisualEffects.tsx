import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  FIREBALL_RADIUS,
  getSkillDefinition,
  type SkillKind,
  type SkillVisualEvent,
} from '@spellbound/shared';
import * as THREE from 'three';

const DAMAGE_NUMBER_COLORS: Record<SkillKind, string> = {
  fireball: '#ff8855',
  impulse: '#88aaff',
  blink: '#ffe080',
};

const SHARED_RING = new THREE.RingGeometry(0.18, 1, 24);
const SHARED_SPHERE = new THREE.SphereGeometry(1, 10, 10);
const SHARED_OCT = new THREE.OctahedronGeometry(0.35, 0);
const SHARED_BOX = new THREE.BoxGeometry(0.14, 0.14, 1);

function getEffectAge(event: SkillVisualEvent): number {
  return performance.now() / 1000 - event.createdAt;
}

const AoERing = memo(function AoERing({ event }: { event: SkillVisualEvent }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const theme = useMemo(() => getSkillDefinition(event.skillKind), [event.skillKind]);
  const duration = event.skillKind === 'impulse' ? 0.6 : 0.5;
  const maxRadius = event.radius;

  useFrame(() => {
    const age = getEffectAge(event);
    const group = groupRef.current;
    if (!group) return;

    if (age >= duration) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const t = age / duration;
    const scale = maxRadius * (0.35 + t * 0.95);
    group.scale.set(scale, scale, 1);
    if (materialRef.current) materialRef.current.opacity = (1 - t) * 0.8;
    if (innerMaterialRef.current) {
      innerMaterialRef.current.opacity = (1 - t) * 0.35;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[event.position.x, 0.06, event.position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <mesh geometry={SHARED_RING}>
        <meshBasicMaterial
          ref={materialRef}
          color={theme.themeColor}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {event.skillKind === 'impulse' && (
        <mesh geometry={SHARED_RING} scale={[0.55, 0.55, 1]}>
          <meshBasicMaterial
            ref={innerMaterialRef}
            color={theme.emissiveColor}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
});

const CastFlash = memo(function CastFlash({ event }: { event: SkillVisualEvent }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const theme = useMemo(() => getSkillDefinition(event.skillKind), [event.skillKind]);
  const duration = 0.28;
  const baseRadius = event.radius;

  useFrame(() => {
    const age = getEffectAge(event);
    const group = groupRef.current;
    if (!group) return;

    if (age >= duration) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const t = age / duration;
    const scale = baseRadius * (0.4 + t * 0.9);
    group.scale.setScalar(scale);
    if (materialRef.current) materialRef.current.opacity = (1 - t) * 0.9;
  });

  return (
    <group ref={groupRef} position={[event.position.x, event.position.y, event.position.z]}>
      <mesh geometry={SHARED_SPHERE}>
        <meshBasicMaterial
          ref={materialRef}
          color={theme.emissiveColor}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

const ImpactBurst = memo(function ImpactBurst({ event }: { event: SkillVisualEvent }) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const theme = useMemo(() => getSkillDefinition(event.skillKind), [event.skillKind]);
  const duration = 0.35;
  const baseRadius = event.radius;

  useFrame(() => {
    const age = getEffectAge(event);
    const group = groupRef.current;
    if (!group) return;

    if (age >= duration) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const t = age / duration;
    const scale = baseRadius * (0.25 + t * 1.1);
    group.scale.setScalar(scale);
    const opacity = (1 - t) * 0.85;
    if (sphereMaterialRef.current) {
      sphereMaterialRef.current.opacity = opacity;
      sphereMaterialRef.current.emissiveIntensity = (1 - t) * 2;
    }
    if (ringMaterialRef.current) ringMaterialRef.current.opacity = opacity * 0.7;
  });

  return (
    <group ref={groupRef} position={[event.position.x, event.position.y, event.position.z]}>
      <mesh geometry={SHARED_SPHERE}>
        <meshStandardMaterial
          ref={sphereMaterialRef}
          color={theme.themeColor}
          emissive={theme.emissiveColor}
          emissiveIntensity={2}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={SHARED_RING}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -event.position.y + 0.05, 0]}
        scale={[0.8, 0.8, 1]}
      >
        <meshBasicMaterial
          ref={ringMaterialRef}
          color={theme.emissiveColor}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

const TeleportArc = memo(function TeleportArc({ event }: { event: SkillVisualEvent }) {
  const groupRef = useRef<THREE.Group>(null);
  const beamMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const theme = useMemo(() => getSkillDefinition('blink'), []);
  const duration = 0.4;
  const layout = useMemo(() => {
    if (!event.targetPosition) return null;
    const from = event.position;
    const to = event.targetPosition;
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.hypot(dx, dz) || 0.001;
    return {
      from,
      to,
      midX: (from.x + to.x) / 2,
      midZ: (from.z + to.z) / 2,
      angle: Math.atan2(dx, dz),
      len,
    };
  }, [event.position, event.targetPosition]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !layout) return;

    const age = getEffectAge(event);
    if (age >= duration) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const t = age / duration;
    const opacity = (1 - t) * 0.85;
    if (beamMaterialRef.current) beamMaterialRef.current.opacity = opacity;
    group.children.forEach((child, index) => {
      if (index === 0) return;
      const scale = 1 - t;
      child.scale.setScalar(scale);
      const material = (child as THREE.Mesh).material;
      if (material && 'opacity' in material) {
        (material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });
  });

  if (!layout) return null;

  return (
    <group ref={groupRef}>
      <group
        position={[layout.midX, 0.75, layout.midZ]}
        rotation={[0, layout.angle, 0]}
        scale={[1, 1, layout.len]}
      >
        <mesh geometry={SHARED_BOX}>
          <meshBasicMaterial
            ref={beamMaterialRef}
            color={theme.emissiveColor}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      </group>
      {[layout.from, layout.to].map((pos, index) => (
        <mesh key={index} position={[pos.x, 0.9, pos.z]} geometry={SHARED_OCT}>
          <meshBasicMaterial
            color={theme.themeColor}
            transparent
            opacity={0.85}
            wireframe
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});

export const SkillVisualEffect = memo(
  function SkillVisualEffect({ event }: { event: SkillVisualEvent }) {
    switch (event.kind) {
      case 'aoe':
        return <AoERing event={event} />;
      case 'cast':
        return <CastFlash event={event} />;
      case 'impact':
        return <ImpactBurst event={event} />;
      case 'teleport':
        return <TeleportArc event={event} />;
      default:
        return null;
    }
  },
  (prev, next) => prev.event.id === next.event.id,
);

const FIREBALL_GEO = new THREE.SphereGeometry(FIREBALL_RADIUS, 10, 10);
const FIREBALL_GLOW_GEO = new THREE.SphereGeometry(FIREBALL_RADIUS, 8, 8);

export const FireballProjectile = memo(function FireballProjectile({
  position,
}: {
  position: { x: number; y: number; z: number };
}) {
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh geometry={FIREBALL_GEO}>
        <meshStandardMaterial
          color="#ff6020"
          emissive="#ff4010"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh geometry={FIREBALL_GLOW_GEO} scale={1.5}>
        <meshBasicMaterial
          color="#ff9040"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

export function getSkillDamageColor(skillKind?: SkillKind): string {
  if (!skillKind) return '#ff6666';
  return DAMAGE_NUMBER_COLORS[skillKind];
}
