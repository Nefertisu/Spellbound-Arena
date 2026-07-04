import { DAY_CYCLE_DURATION } from '../constants/battle.js';

export function formatBattleTime(dayTime: number): string {
  const totalMinutes = Math.floor(dayTime * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function isDaytime(dayTime: number): boolean {
  return Math.sin(dayTime * Math.PI * 2) >= -0.05;
}

export function getDayNightDialPosition(dayTime: number): { x: number; y: number } {
  const angle = Math.PI * (1 - dayTime);
  const radius = 46;
  const cx = 50;
  const cy = 48;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  };
}

export function advanceDayTime(dayTime: number, dt: number): number {
  return (dayTime + dt / DAY_CYCLE_DURATION) % 1;
}

export interface DayNightLighting {
  ambientIntensity: number;
  sunIntensity: number;
  moonIntensity: number;
  fillIntensity: number;
  overheadFillIntensity: number;
  arenaGlowIntensity: number;
  exposureBoost: number;
  sunPosition: { x: number; y: number; z: number };
  moonPosition: { x: number; y: number; z: number };
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  useFog: boolean;
  sunVisible: boolean;
  moonVisible: boolean;
  nightFactor: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getDayNightLighting(dayTime: number): DayNightLighting {
  const angle = dayTime * Math.PI * 2;
  const sunHeight = Math.sin(angle);

  const sunX = Math.cos(angle) * 55;
  const sunY = sunHeight * 35 + 5;
  const sunZ = Math.sin(angle * 0.7) * 25;

  const moonAngle = angle + Math.PI;
  const moonHeight = Math.sin(moonAngle);
  const moonX = Math.cos(moonAngle) * 50;
  const moonY = moonHeight * 30 + 5;
  const moonZ = -Math.sin(moonAngle * 0.7) * 20;

  const daylight = Math.max(0, Math.min(1, (sunHeight + 0.15) / 1.15));
  const nightFactor = Math.max(0, -sunHeight);
  const moonAboveHorizon = moonHeight > -0.08;

  const skyR = Math.round(lerp(48, 130, daylight));
  const skyG = Math.round(lerp(52, 175, daylight));
  const skyB = Math.round(lerp(88, 235, daylight));

  const fogR = Math.round(lerp(70, 130, daylight));
  const fogG = Math.round(lerp(72, 175, daylight));
  const fogB = Math.round(lerp(100, 235, daylight));

  return {
    ambientIntensity: lerp(0.82, 0.5, daylight),
    sunIntensity: Math.max(0, sunHeight) * 1.35,
    moonIntensity: moonAboveHorizon ? Math.max(0, moonHeight) * 1.1 : 0,
    fillIntensity: lerp(0.95, 0.4, daylight),
    overheadFillIntensity: lerp(0.75, 0.15, daylight),
    arenaGlowIntensity: lerp(0.9, 0.45, daylight),
    exposureBoost: lerp(1.55, 1.0, daylight),
    sunPosition: { x: sunX, y: Math.max(2, sunY), z: sunZ },
    moonPosition: {
      x: moonX,
      y: moonAboveHorizon ? Math.max(2, moonY) : moonY,
      z: moonZ,
    },
    skyColor: `rgb(${skyR},${skyG},${skyB})`,
    fogColor: `rgb(${fogR},${fogG},${fogB})`,
    fogNear: lerp(90, 45, daylight),
    fogFar: lerp(280, 140, daylight),
    useFog: daylight > 0.35,
    sunVisible: sunHeight > -0.08,
    moonVisible: moonAboveHorizon,
    nightFactor,
  };
}
