import type { BattleEntity } from '../types/battle.js';

export interface CollisionMTV {
  nx: number;
  nz: number;
  depth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function circleVsCircle(
  ax: number,
  az: number,
  aRadius: number,
  bx: number,
  bz: number,
  bRadius: number,
): CollisionMTV | null {
  const dx = ax - bx;
  const dz = az - bz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const minDist = aRadius + bRadius;
  if (dist >= minDist) return null;

  if (dist < 1e-6) {
    return { nx: 1, nz: 0, depth: minDist };
  }

  return {
    nx: dx / dist,
    nz: dz / dist,
    depth: minDist - dist,
  };
}

export function circleVsBox(
  cx: number,
  cz: number,
  radius: number,
  bx: number,
  bz: number,
  halfX: number,
  halfZ: number,
): CollisionMTV | null {
  const closestX = clamp(cx, bx - halfX, bx + halfX);
  const closestZ = clamp(cz, bz - halfZ, bz + halfZ);
  const dx = cx - closestX;
  const dz = cz - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq > radius * radius) return null;

  if (distSq < 1e-8) {
    const left = cx - (bx - halfX);
    const right = bx + halfX - cx;
    const top = cz - (bz - halfZ);
    const bottom = bz + halfZ - cz;
    const minPen = Math.min(left, right, top, bottom);

    if (minPen === left) return { nx: -1, nz: 0, depth: radius + minPen };
    if (minPen === right) return { nx: 1, nz: 0, depth: radius + minPen };
    if (minPen === top) return { nx: 0, nz: -1, depth: radius + minPen };
    return { nx: 0, nz: 1, depth: radius + minPen };
  }

  const dist = Math.sqrt(distSq);
  return {
    nx: dx / dist,
    nz: dz / dist,
    depth: radius - dist,
  };
}

export function boxVsBox(
  ax: number,
  az: number,
  aHalfX: number,
  aHalfZ: number,
  bx: number,
  bz: number,
  bHalfX: number,
  bHalfZ: number,
): CollisionMTV | null {
  const overlapX = aHalfX + bHalfX - Math.abs(ax - bx);
  const overlapZ = aHalfZ + bHalfZ - Math.abs(az - bz);
  if (overlapX <= 0 || overlapZ <= 0) return null;

  if (overlapX < overlapZ) {
    return { nx: ax < bx ? -1 : 1, nz: 0, depth: overlapX };
  }

  return { nx: 0, nz: az < bz ? -1 : 1, depth: overlapZ };
}

export function getCollisionMTV(a: BattleEntity, b: BattleEntity): CollisionMTV | null {
  const aBox = a.halfExtents;
  const bBox = b.halfExtents;

  if (!aBox && !bBox) {
    return circleVsCircle(
      a.position.x,
      a.position.z,
      a.radius,
      b.position.x,
      b.position.z,
      b.radius,
    );
  }

  if (!aBox && bBox) {
    return circleVsBox(
      a.position.x,
      a.position.z,
      a.radius,
      b.position.x,
      b.position.z,
      bBox.x,
      bBox.z,
    );
  }

  if (aBox && !bBox) {
    const mtv = circleVsBox(
      b.position.x,
      b.position.z,
      b.radius,
      a.position.x,
      a.position.z,
      aBox.x,
      aBox.z,
    );
    if (!mtv) return null;
    return { nx: -mtv.nx, nz: -mtv.nz, depth: mtv.depth };
  }

  return boxVsBox(
    a.position.x,
    a.position.z,
    aBox!.x,
    aBox!.z,
    b.position.x,
    b.position.z,
    bBox!.x,
    bBox!.z,
  );
}

export function projectileHitsEntity(
  px: number,
  pz: number,
  projRadius: number,
  entity: BattleEntity,
): boolean {
  const box = entity.halfExtents;
  if (!box) {
    const dx = px - entity.position.x;
    const dz = pz - entity.position.z;
    const reach = projRadius + entity.radius;
    return dx * dx + dz * dz <= reach * reach;
  }

  return (
    circleVsBox(
      px,
      pz,
      projRadius,
      entity.position.x,
      entity.position.z,
      box.x,
      box.z,
    ) !== null
  );
}

function isStaticObstacle(entity: BattleEntity): boolean {
  return entity.type === 'crate' || entity.type === 'pillar';
}

export function separateEntities(
  a: BattleEntity,
  b: BattleEntity,
  mtv: CollisionMTV,
): { a: BattleEntity; b: BattleEntity } {
  const aStatic = isStaticObstacle(a);
  const bStatic = isStaticObstacle(b);

  if (aStatic && bStatic) {
    return { a, b };
  }

  if (aStatic && !bStatic) {
    return {
      a,
      b: {
        ...b,
        position: {
          ...b.position,
          x: b.position.x - mtv.nx * mtv.depth,
          z: b.position.z - mtv.nz * mtv.depth,
        },
      },
    };
  }

  if (!aStatic && bStatic) {
    return {
      a: {
        ...a,
        position: {
          ...a.position,
          x: a.position.x + mtv.nx * mtv.depth,
          z: a.position.z + mtv.nz * mtv.depth,
        },
      },
      b,
    };
  }

  const half = mtv.depth * 0.5;
  return {
    a: {
      ...a,
      position: {
        ...a.position,
        x: a.position.x + mtv.nx * half,
        z: a.position.z + mtv.nz * half,
      },
    },
    b: {
      ...b,
      position: {
        ...b.position,
        x: b.position.x - mtv.nx * half,
        z: b.position.z - mtv.nz * half,
      },
    },
  };
}
