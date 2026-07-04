import { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { getDominantStat, sortEquippedGear, type CharacterStats, type GearKind, type ShopGear, type StatKey } from '@spellbound/shared';

import type { Group } from 'three';

import { GearModel } from './GearModel';



const MANNEQUIN_WHITE = '#e8e8ec';

const MANNEQUIN_ROUGHNESS = 0.48;

const MANNEQUIN_METALNESS = 0.04;



const STAT_TINTS: Record<StatKey, string> = {

  agility: '#e6ece8',

  strength: '#ece8e4',

  intelligence: '#e6e8f0',

  fury: '#f0e6e6',

  statusResistance: '#e6eaee',

  pushResistance: '#eceae6',

};



export interface MannequinModelProps {

  stats?: CharacterStats;

  colorizeByStats?: boolean;

  isBot?: boolean;

  animate?: boolean;

  feetOnGround?: boolean;

  offsetY?: number;

  scale?: number;

  showShadow?: boolean;

  rotateSlowly?: boolean;

  nightBoost?: number;

  headGear?: GearKind | null;

  equippedGearKinds?: GearKind[];

  equippedGear?: ShopGear[];

}



function BodyMaterial({ color, nightBoost = 0 }: { color: string; nightBoost?: number }) {

  return (

    <meshStandardMaterial

      color={color}

      emissive={color}

      emissiveIntensity={nightBoost * 0.5}

      roughness={MANNEQUIN_ROUGHNESS}

      metalness={MANNEQUIN_METALNESS}

    />

  );

}



interface LimbProps {

  position: [number, number, number];

  rotation?: [number, number, number];

  radius: number;

  length: number;

  color: string;

  nightBoost?: number;

}



function Limb({ position, rotation = [0, 0, 0], radius, length, color, nightBoost = 0 }: LimbProps) {

  return (

    <mesh position={position} rotation={rotation}>

      <capsuleGeometry args={[radius, length, 6, 12]} />

      <BodyMaterial color={color} nightBoost={nightBoost} />

    </mesh>

  );

}



export function MannequinModel({

  stats,

  colorizeByStats = false,

  isBot,

  animate = true,

  feetOnGround = false,

  offsetY = 0,

  scale = 1,

  showShadow = false,

  rotateSlowly = false,

  nightBoost = 0,

  headGear = null,

  equippedGearKinds,

  equippedGear,

}: MannequinModelProps) {

  const groupRef = useRef<Group>(null);



  const resolvedGear = useMemo(() => {

    if (equippedGear && equippedGear.length > 0) {

      return sortEquippedGear(equippedGear);

    }

    const kinds =

      equippedGearKinds && equippedGearKinds.length > 0

        ? equippedGearKinds

        : headGear

          ? [headGear]

          : [];

    return kinds.map((kind, index) => ({

      id: `fallback-${kind}-${index}`,

      kind,

      visualVariant: 0,

      rarity: 'common' as const,

      name: kind,

      price: 0,

      statBonus: {

        agility: 0,

        strength: 0,

        intelligence: 0,

        fury: 0,

        statusResistance: 0,

        pushResistance: 0,

      },

    }));

  }, [equippedGear, equippedGearKinds, headGear]);



  const hasHelmet = resolvedGear.some((gear) => gear.kind === 'helmet');



  const bodyColor = useMemo(() => {

    if (!colorizeByStats || !stats) return MANNEQUIN_WHITE;

    return STAT_TINTS[getDominantStat(stats)];

  }, [colorizeByStats, stats]);



  useFrame((state) => {

    if (!groupRef.current) return;



    if (rotateSlowly) {

      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;

    }



    if (!animate) return;



    const baseY = feetOnGround ? 0 : offsetY;

    groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.2) * 0.02;

  });



  const rootY = feetOnGround ? 0 : offsetY;



  return (

    <group ref={groupRef} position={[0, rootY, 0]} scale={scale}>

      {showShadow && (

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>

          <circleGeometry args={[0.45, 32]} />

          <meshBasicMaterial color="#000000" transparent opacity={0.35} />

        </mesh>

      )}



      <Limb position={[0, 0.9, 0]} radius={0.13} length={0.18} color={bodyColor} nightBoost={nightBoost} />

      <Limb position={[0, 1.24, 0]} radius={0.17} length={0.36} color={bodyColor} nightBoost={nightBoost} />

      <Limb position={[0, 1.52, 0]} radius={0.06} length={0.1} color={bodyColor} nightBoost={nightBoost} />



      <mesh position={[0, 1.68, 0]}>

        <sphereGeometry args={[0.15, 16, 16]} />

        <BodyMaterial color={bodyColor} nightBoost={nightBoost} />

      </mesh>



      {resolvedGear.map((gear) => (

        <GearModel

          key={gear.id}

          kind={gear.kind}

          variant={gear.visualVariant}

          rarity={gear.rarity}

          nightBoost={nightBoost}

          hoodUnderHelmet={gear.kind === 'hood' && hasHelmet}

        />

      ))}



      <Limb position={[-0.12, 0.54, 0]} radius={0.09} length={0.34} color={bodyColor} nightBoost={nightBoost} />

      <Limb position={[0.12, 0.54, 0]} radius={0.09} length={0.34} color={bodyColor} nightBoost={nightBoost} />

      <Limb position={[-0.12, 0.21, 0.02]} radius={0.08} length={0.3} color={bodyColor} nightBoost={nightBoost} />

      <Limb position={[0.12, 0.21, 0.02]} radius={0.08} length={0.3} color={bodyColor} nightBoost={nightBoost} />



      <Limb

        position={[-0.3, 1.26, 0]}

        rotation={[0, 0, 0.35]}

        radius={0.07}

        length={0.28}

        color={bodyColor}

        nightBoost={nightBoost}

      />

      <Limb

        position={[0.3, 1.26, 0]}

        rotation={[0, 0, -0.35]}

        radius={0.07}

        length={0.28}

        color={bodyColor}

        nightBoost={nightBoost}

      />

      <Limb

        position={[-0.42, 0.98, 0.02]}

        rotation={[0.15, 0, 0.25]}

        radius={0.06}

        length={0.26}

        color={bodyColor}

        nightBoost={nightBoost}

      />

      <Limb

        position={[0.42, 0.98, 0.02]}

        rotation={[0.15, 0, -0.25]}

        radius={0.06}

        length={0.26}

        color={bodyColor}

        nightBoost={nightBoost}

      />



      {isBot && (

        <>

          <mesh position={[-0.06, 1.7, 0.12]}>

            <sphereGeometry args={[0.025, 8, 8]} />

            <meshBasicMaterial color="#ff3030" />

          </mesh>

          <mesh position={[0.06, 1.7, 0.12]}>

            <sphereGeometry args={[0.025, 8, 8]} />

            <meshBasicMaterial color="#ff3030" />

          </mesh>

        </>

      )}

    </group>

  );

}


