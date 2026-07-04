import { memo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { BattleEntity, BattleState, DamageEvent } from '@spellbound/shared';
import { canCastSkill, getDayNightLighting, type ArenaMapId, type CorruptedPlatformPatch } from '@spellbound/shared';
import { useBattleStore } from '../../stores/battleStore';
import { CharacterModel, ObstacleModel } from '../../components/three/CharacterModel';
import { ArenaFloorMeshes } from '../../components/three/ArenaFloorMeshes';
import {
  FireballProjectile,
  getSkillDamageColor,
  SkillVisualEffect,
} from '../../components/three/battle/SkillVisualEffects';
import * as THREE from 'three';

const CAMERA_PIVOT_HEIGHT = 1.55;
const CAMERA_MIN_HEIGHT = 4.2;
const LOOK_AHEAD = 50;

function ExposureControl({ exposure }: { exposure: number }) {
  const { gl } = useThree();

  useFrame(() => {
    gl.toneMappingExposure = exposure;
  });

  return null;
}

function DayNightEnvironment({
  dayTime,
  mapId,
}: {
  dayTime: number;
  mapId: ArenaMapId;
}) {
  const lighting = getDayNightLighting(dayTime);
  const { sunPosition, moonPosition } = lighting;
  const isNight = lighting.nightFactor > 0.35;
  const isCrystal = mapId === 'crystal_rift';
  const skyColor = isCrystal
    ? isNight
      ? '#0a0820'
      : '#181038'
    : lighting.skyColor;
  const fogColor = isCrystal ? '#120828' : lighting.fogColor;

  return (
    <>
      <ExposureControl exposure={lighting.exposureBoost} />
      <color attach="background" args={[skyColor]} />
      {(lighting.useFog || isCrystal) && (
        <fog
          attach="fog"
          args={[fogColor, isCrystal ? 28 : lighting.fogNear, isCrystal ? 95 : lighting.fogFar]}
        />
      )}
      <ambientLight
        intensity={isCrystal ? lighting.ambientIntensity * 0.75 : lighting.ambientIntensity}
        color={isCrystal ? '#b8c8ff' : lighting.sunVisible ? '#e8dcc8' : '#d0d8f0'}
      />
      <hemisphereLight
        intensity={lighting.fillIntensity}
        color={isCrystal ? '#d0e8ff' : isNight ? '#c8d4f8' : '#fff8f0'}
        groundColor={isCrystal ? '#201040' : isNight ? '#6a4830' : '#2a1a12'}
      />
      <directionalLight
        position={[0, 50, 12]}
        intensity={lighting.overheadFillIntensity}
        color="#dce4ff"
      />
      <directionalLight
        position={[sunPosition.x, sunPosition.y, sunPosition.z]}
        intensity={lighting.sunIntensity}
        color="#fff4e0"
        castShadow={false}
      />
      {lighting.moonVisible && (
        <directionalLight
          position={[moonPosition.x, moonPosition.y, moonPosition.z]}
          intensity={lighting.moonIntensity}
          color="#d8e4ff"
        />
      )}
      <pointLight
        position={[0, 8, 0]}
        intensity={isCrystal ? 0.45 : lighting.arenaGlowIntensity}
        color={isCrystal ? '#70e8ff' : '#f0b050'}
        distance={55}
      />
      <pointLight
        position={[0, 3, 0]}
        intensity={isCrystal ? 0.55 : 0.35 + lighting.nightFactor * 0.45}
        color={isCrystal ? '#a060ff' : '#ff7050'}
        distance={35}
      />

      {lighting.sunVisible && (
        <group position={[sunPosition.x, sunPosition.y, sunPosition.z]}>
          <mesh>
            <sphereGeometry args={[2.8, 24, 24]} />
            <meshBasicMaterial color="#ffdd55" />
          </mesh>
          <pointLight intensity={1.2} color="#ffcc66" distance={80} />
        </group>
      )}

      {lighting.moonVisible && (
        <group position={[moonPosition.x, moonPosition.y, moonPosition.z]}>
          <mesh>
            <sphereGeometry args={[1.8, 20, 20]} />
            <meshBasicMaterial color="#d8e4ff" />
          </mesh>
          <pointLight intensity={1.1 + lighting.nightFactor * 0.5} color="#c8d8ff" distance={90} />
        </group>
      )}
    </>
  );
}

function ArenaFloor({
  mapId,
  radius,
  nightFactor,
  corruptedPatches,
}: {
  mapId: ArenaMapId;
  radius: number;
  nightFactor: number;
  corruptedPatches: readonly CorruptedPlatformPatch[];
}) {
  return (
    <ArenaFloorMeshes
      mapId={mapId}
      radius={radius}
      nightFactor={nightFactor}
      corruptedPatches={corruptedPatches}
    />
  );
}

function HpBar({ entity }: { entity: BattleEntity }) {
  if (!entity.alive) return null;
  const ratio = entity.hp / entity.maxHp;
  const color = ratio > 0.5 ? '#50a050' : ratio > 0.25 ? '#c9a227' : '#cc3333';

  return (
    <Html
      position={[0, entity.type === 'player' ? 2.2 : entity.type === 'pillar' ? 2.5 : 1.4, 0]}
      center
      distanceFactor={12}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          width: 48,
          height: 5,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid #3d2817',
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            background: color,
          }}
        />
      </div>
      {entity.type === 'player' && (
        <div
          style={{
            fontSize: 9,
            color: '#d4c4a8',
            textAlign: 'center',
            marginTop: 2,
            letterSpacing: '0.05em',
          }}
        >
          {entity.name}
        </div>
      )}
    </Html>
  );
}

const DamageNumber = memo(function DamageNumber({ event }: { event: DamageEvent }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const groupRef = useRef<THREE.Group>(null);
  const color = getSkillDamageColor(event.skillKind);

  useFrame(() => {
    const age = performance.now() / 1000 - event.createdAt;
    const opacity = Math.max(0, 1 - age / 1.2);
    const yOffset = age * 1.5;

    if (groupRef.current) {
      groupRef.current.position.set(event.position.x, event.position.y + 2 + yOffset, event.position.z);
    }
    if (spanRef.current) {
      spanRef.current.style.opacity = String(opacity);
    }
  });

  return (
    <group ref={groupRef} position={[event.position.x, event.position.y + 2, event.position.z]}>
      <Html center distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <span
          ref={spanRef}
          style={{
            color,
            fontWeight: 700,
            fontSize: 18,
            opacity: 1,
            textShadow: '0 0 6px #000',
            fontFamily: 'Cinzel, serif',
          }}
        >
          -{event.amount}
        </span>
      </Html>
    </group>
  );
}, (prev, next) => prev.event.id === next.event.id);

function entityRenderKey(entity: BattleEntity): string {
  return [
    entity.id,
    entity.alive,
    entity.hp,
    entity.maxHp,
    entity.facing.toFixed(3),
    entity.position.x.toFixed(2),
    entity.position.y.toFixed(2),
    entity.position.z.toFixed(2),
    entity.name,
  ].join('|');
}

const EntityMesh = memo(function EntityMesh({
  entity,
  nightFactor,
  obstacleVariant,
}: {
  entity: BattleEntity;
  nightFactor: number;
  obstacleVariant: 'default' | 'crystal';
}) {
  if (!entity.alive && entity.type === 'player') return null;

  const hpRatio = entity.hp / entity.maxHp;

  return (
    <group
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[0, entity.facing, 0]}
    >
      {entity.type === 'player' ? (
        <group position={[0, 0, 0]}>
          <CharacterModel
            stats={entity.characterStats}
            isBot={entity.isBot}
            animate={false}
            feetOnGround
            nightBoost={nightFactor}
            equippedGearKinds={entity.equippedGearKinds ?? []}
            equippedGear={entity.equippedGear ?? []}
          />
        </group>
      ) : entity.alive ? (
        <ObstacleModel type={entity.type} hpRatio={hpRatio} nightBoost={nightFactor} variant={obstacleVariant} />
      ) : null}
      {entity.alive && <HpBar entity={entity} />}
    </group>
  );
}, (prev, next) =>
  entityRenderKey(prev.entity) === entityRenderKey(next.entity) &&
  prev.nightFactor === next.nightFactor &&
  prev.obstacleVariant === next.obstacleVariant);

function BattleCamera({ target }: { target?: BattleEntity }) {
  const { camera } = useThree();
  const desiredPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const pivot = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const flatForward = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (!target) return;

    const { cameraYaw, cameraPitch, cameraDistance } = useBattleStore.getState();
    const pitch = Math.max(-0.35, Math.min(1.15, cameraPitch));
    const cosP = Math.cos(pitch);
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);

    forward.current.set(sinY * cosP, Math.sin(pitch), cosY * cosP).normalize();

    pivot.current.set(
      target.position.x,
      target.position.y + CAMERA_PIVOT_HEIGHT,
      target.position.z,
    );

    desiredPos.current
      .copy(forward.current)
      .multiplyScalar(-cameraDistance)
      .add(pivot.current);
    desiredPos.current.y = Math.max(
      target.position.y + CAMERA_MIN_HEIGHT,
      desiredPos.current.y,
    );

    lookTarget.current
      .copy(forward.current)
      .multiplyScalar(LOOK_AHEAD)
      .add(pivot.current);

    camera.position.lerp(desiredPos.current, Math.min(1, dt * 12));
    camera.lookAt(lookTarget.current);

    flatForward.current.set(forward.current.x, 0, forward.current.z);
    if (flatForward.current.lengthSq() > 0.001) {
      flatForward.current.normalize();
      useBattleStore
        .getState()
        .setCameraForward(flatForward.current.x, flatForward.current.z);
    }
  });

  return null;
}

const ZERO_INPUT = {
  moveX: 0,
  moveZ: 0,
  jump: false,
  skillIndex: null,
  aimX: 0,
  aimZ: 1,
} as const;

function runBotAI(state: BattleState, dt: number) {
  const botEntities = state.entities.filter((e) => e.isBot && e.alive && e.type === 'player');

  if (state.botDifficulty === 'passive') {
    for (const bot of botEntities) {
      useBattleStore.getState().setInput(bot.playerId!, { ...ZERO_INPUT });
    }
    return;
  }

  for (const bot of botEntities) {
    const enemies = state.entities.filter(
      (e) => e.alive && e.teamId !== bot.teamId && e.teamId !== 'neutral',
    );
    const target = enemies[0];
    if (!target) continue;

    const dx = target.position.x - bot.position.x;
    const dz = target.position.z - bot.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;

    const meta = state.players.find((p) => p.playerId === bot.playerId);
    const skills = meta?.equippedSkills ?? [];

    if (skills.length > 0 && dist < 12 && Math.random() < dt * 0.5) {
      const castable = skills.filter((skill) => canCastSkill(state, bot, skill));
      if (castable.length === 0) continue;
      const skill = castable[Math.floor(Math.random() * castable.length)]!;
      useBattleStore.getState().queueSkill(bot.id, skill, dx / dist, dz / dist);
    }

    useBattleStore.getState().setInput(bot.playerId!, {
      moveX: dx / dist,
      moveZ: dz / dist,
      jump: false,
      skillIndex: null,
      aimX: dx / dist,
      aimZ: dz / dist,
    });
  }
}

function BattleScene({ paused = false }: { paused?: boolean }) {
  const battle = useBattleStore((s) => s.battle);
  const nowRef = useRef(performance.now() / 1000);

  const localEntity = battle?.entities.find(
    (e) => e.playerId === battle.localPlayerId && e.type === 'player',
  );

  useFrame((_, dt) => {
    if (!battle || battle.phase !== 'combat' || paused) return;
    nowRef.current = performance.now() / 1000;
    runBotAI(battle, dt);
    useBattleStore.getState().tick(dt, nowRef.current);
  });

  if (!battle) return null;

  const lighting = getDayNightLighting(battle.dayTime);
  const obstacleVariant =
    battle.mapId === 'crystal_rift' ? 'crystal' : 'default';

  return (
    <>
      <DayNightEnvironment dayTime={battle.dayTime} mapId={battle.mapId} />

      <ArenaFloor
        mapId={battle.mapId}
        radius={battle.arenaRadius}
        nightFactor={lighting.nightFactor}
        corruptedPatches={battle.corruptedPatches}
      />
      <BattleCamera target={localEntity} />

      {battle.entities.map((entity) => (
        <EntityMesh
          key={entity.id}
          entity={entity}
          nightFactor={lighting.nightFactor}
          obstacleVariant={obstacleVariant}
        />
      ))}

      {battle.projectiles.map((p) => (
        <FireballProjectile key={p.id} position={p.position} />
      ))}

      {battle.visualEvents.map((e) => (
        <SkillVisualEffect key={e.id} event={e} />
      ))}

      {battle.damageEvents.map((e) => (
        <DamageNumber key={e.id} event={e} />
      ))}
    </>
  );
}

export function BattleArena({ paused = false }: { paused?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 9, 12], fov: 55 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      <BattleScene paused={paused} />
    </Canvas>
  );
}
