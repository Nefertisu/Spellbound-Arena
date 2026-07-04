import { CRYSTAL_INNER_VOID_RATIO, CRYSTAL_PLATFORM_INSET } from '@spellbound/shared';

export interface CrystalDecorPlacement {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  color: string;
  spin: number;
  animated: boolean;
  rotation: [number, number, number];
}

const CRYSTAL_PALETTE = ['#5ce8ff', '#b070ff', '#80f0ff', '#c080ff', '#40d8ff', '#90a8ff'] as const;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickColor(rand: () => number): string {
  return CRYSTAL_PALETTE[Math.floor(rand() * CRYSTAL_PALETTE.length)] ?? '#5ce8ff';
}

export function generateCrystalRiftDecor(
  arenaRadius: number,
  preview: boolean,
): CrystalDecorPlacement[] {
  const rand = mulberry32(90210);
  const r = preview ? 20 : arenaRadius;
  const innerVoid = r * CRYSTAL_INNER_VOID_RATIO;
  const platformInner = innerVoid + CRYSTAL_PLATFORM_INSET;
  const platformOuter = r - 0.35;

  const placements: CrystalDecorPlacement[] = [];
  let id = 0;

  const push = (placement: Omit<CrystalDecorPlacement, 'id'>) => {
    placements.push({ ...placement, id: `crystal-${id++}` });
  };

  const floatingCount = preview ? 10 : 18;
  for (let i = 0; i < floatingCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = platformInner * 0.65 + rand() * (r * 0.95 - platformInner * 0.65);
    push({
      x: Math.cos(angle) * dist,
      y: -1.2 - rand() * 10,
      z: Math.sin(angle) * dist,
      scale: 0.22 + rand() * 0.45,
      color: pickColor(rand),
      spin: 0.15 + rand() * 0.55,
      animated: true,
      rotation: [0.4 + rand() * 0.8, rand() * Math.PI * 2, rand() * 0.5],
    });
  }

  const platformCount = preview ? 16 : 36;
  for (let i = 0; i < platformCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = platformInner + rand() * (platformOuter - platformInner);
    if (Math.hypot(Math.cos(angle) * dist, Math.sin(angle) * dist) < innerVoid + 0.6) {
      continue;
    }
    push({
      x: Math.cos(angle) * dist,
      y: 0.08 + rand() * 0.55,
      z: Math.sin(angle) * dist,
      scale: 0.1 + rand() * 0.28,
      color: pickColor(rand),
      spin: 0,
      animated: false,
      rotation: [rand() * 0.35, rand() * Math.PI * 2, rand() * 0.35],
    });
  }

  const ringCount = preview ? 8 : 16;
  const ringRadius = innerVoid + 1.1 + CRYSTAL_PLATFORM_INSET * 0.35;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2 + rand() * 0.12;
    push({
      x: Math.cos(angle) * ringRadius,
      y: 0.2 + rand() * 1.4,
      z: Math.sin(angle) * ringRadius,
      scale: 0.14 + rand() * 0.22,
      color: pickColor(rand),
      spin: 0.2 + rand() * 0.35,
      animated: false,
      rotation: [0.25 + rand() * 0.5, angle, rand() * 0.4],
    });
  }

  return placements;
}
