import {
  BLINK_DAMAGE,
  BLINK_RADIUS,
  BLINK_RANGE,
  FIREBALL_DAMAGE,
  FIREBALL_RADIUS,
  FIREBALL_SPEED,
  FIREBALL_TTL,
  GRAVITY,
  GROUND_Y,
  IMPULSE_DAMAGE,
  IMPULSE_PUSH_FORCE,
  IMPULSE_RADIUS,
  JUMP_FORCE,
  LAVA_DAMAGE_PER_SEC,
  MOVE_SPEED,
  PLAYER_COLLISION_RADIUS,
  SKILL_COOLDOWNS,
  SKILL_MANA_COSTS,
} from '../constants/battle.js';
import {
  getArenaMinRadius,
  getArenaShrinkRate,
  getCrystalCorruptedPatchGrowthRate,
  isCrystalPlatformHazard,
  CRYSTAL_CORRUPTED_PATCH_MAX_RADIUS_MULTIPLIER,
} from './arena-maps.js';
import type {
  BattleEntity,
  BattleState,
  PlayerInput,
  Projectile,
  ShopSkill,
  SkillKind,
  SkillVisualEventKind,
  Vec3,
} from '../types/battle.js';
import type { SlotSide } from '../types/lobby.js';
import { generateId } from '../utils/id.js';
import {
  appendDamageEvent,
  computeHpRegenPerSec,
  computeManaRegenPerSec,
  isRoundStatDraftComplete,
} from './battle-init.js';
import { advanceDayTime } from './battle-time.js';
import { getCollisionMTV, projectileHitsEntity, separateEntities } from './collision.js';

function distXZ(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function isHostile(
  attackerTeam: SlotSide | 'neutral',
  targetTeam: SlotSide | 'neutral',
): boolean {
  if (targetTeam === 'neutral') return true;
  if (attackerTeam === 'neutral') return false;
  return attackerTeam !== targetTeam;
}

function appendVisualEvent(
  state: BattleState,
  skillKind: SkillKind,
  kind: SkillVisualEventKind,
  position: Vec3,
  radius: number,
  now: number,
  targetPosition?: Vec3,
): BattleState {
  return {
    ...state,
    visualEvents: [
      ...state.visualEvents,
      {
        id: generateId(),
        skillKind,
        kind,
        position: { ...position },
        targetPosition: targetPosition ? { ...targetPosition } : undefined,
        radius,
        createdAt: now,
      },
    ],
  };
}

function applyDamage(
  state: BattleState,
  target: BattleEntity,
  amount: number,
  now: number,
  skillKind?: SkillKind,
): { state: BattleState; entity: BattleEntity } {
  const hp = Math.max(0, target.hp - amount);
  const alive = hp > 0;
  const entity = { ...target, hp, alive };
  let next = appendDamageEvent(state, target.id, amount, target.position, now, skillKind);
  next = {
    ...next,
    entities: next.entities.map((e) => (e.id === target.id ? entity : e)),
  };

  if (
    !alive &&
    target.type !== 'player' &&
    state.mapId === 'crystal_rift' &&
    target.platformPatchRadius != null
  ) {
    const baseRadius = target.platformPatchRadius;
    const patch = {
      x: target.position.x,
      z: target.position.z,
      radius: baseRadius,
      maxRadius: baseRadius * CRYSTAL_CORRUPTED_PATCH_MAX_RADIUS_MULTIPLIER,
    };
    const alreadyCorrupted = next.corruptedPatches.some(
      (existing) =>
        Math.hypot(existing.x - patch.x, existing.z - patch.z) < patch.radius * 0.35,
    );
    if (!alreadyCorrupted) {
      next = {
        ...next,
        corruptedPatches: [...next.corruptedPatches, patch],
      };
    }
  }

  return { state: next, entity };
}

function pushEntity(
  entity: BattleEntity,
  dirX: number,
  dirZ: number,
  force: number,
): BattleEntity {
  const resist = entity.characterStats?.pushResistance ?? 0;
  const factor = Math.max(0.15, 1 - resist * 0.04);
  const impulse = force * factor;

  if (entity.type === 'player') {
    return {
      ...entity,
      knockbackX: (entity.knockbackX ?? 0) + dirX * impulse,
      knockbackZ: (entity.knockbackZ ?? 0) + dirZ * impulse,
      velocity: {
        ...entity.velocity,
        y: entity.velocity.y + JUMP_FORCE * 0.12 * factor,
      },
    };
  }

  return {
    ...entity,
    velocity: {
      ...entity.velocity,
      x: entity.velocity.x + dirX * impulse,
      z: entity.velocity.z + dirZ * impulse,
      y: entity.velocity.y + 1 * factor,
    },
  };
}

export function getSkillCooldownRemaining(
  state: BattleState,
  playerId: string,
  skillId: string,
): number {
  return state.skillCooldowns[playerId]?.[skillId] ?? 0;
}

export function canCastSkill(
  state: BattleState,
  caster: BattleEntity,
  skill: ShopSkill,
): boolean {
  if (!caster.playerId || !caster.alive || caster.type !== 'player') return false;

  const cooldown = getSkillCooldownRemaining(state, caster.playerId, skill.id);
  if (cooldown > 0) return false;

  const manaCost = SKILL_MANA_COSTS[skill.kind];
  const mana = caster.mana ?? 0;
  return mana >= manaCost;
}

function consumeSkillResources(
  state: BattleState,
  caster: BattleEntity,
  skill: ShopSkill,
): BattleState {
  if (!caster.playerId) return state;

  const manaCost = SKILL_MANA_COSTS[skill.kind];
  const cooldown = SKILL_COOLDOWNS[skill.kind];
  const playerCooldowns = { ...state.skillCooldowns[caster.playerId], [skill.id]: cooldown };

  return {
    ...state,
    skillCooldowns: {
      ...state.skillCooldowns,
      [caster.playerId]: playerCooldowns,
    },
    entities: state.entities.map((entity) =>
      entity.id === caster.id
        ? { ...entity, mana: Math.max(0, (entity.mana ?? 0) - manaCost) }
        : entity,
    ),
  };
}

function tickCombatResources(state: BattleState, dt: number): BattleState {
  const skillCooldowns: Record<string, Record<string, number>> = {};

  for (const [playerId, cooldowns] of Object.entries(state.skillCooldowns)) {
    const nextCooldowns: Record<string, number> = {};
    for (const [skillId, remaining] of Object.entries(cooldowns)) {
      const next = Math.max(0, remaining - dt);
      if (next > 0) nextCooldowns[skillId] = next;
    }
    if (Object.keys(nextCooldowns).length > 0) {
      skillCooldowns[playerId] = nextCooldowns;
    }
  }

  const entities = state.entities.map((entity) => {
    if (entity.type !== 'player' || !entity.alive) return entity;
    const maxMana = entity.maxMana ?? 0;
    const maxHp = entity.maxHp;
    const manaRegen = computeManaRegenPerSec(entity.characterStats);
    const hpRegen = computeHpRegenPerSec(entity.characterStats);
    const mana = Math.min(maxMana, (entity.mana ?? 0) + manaRegen * dt);
    const hp = Math.min(maxHp, entity.hp + hpRegen * dt);
    return { ...entity, mana, hp };
  });

  return {
    ...state,
    dayTime: advanceDayTime(state.dayTime, dt),
    skillCooldowns,
    entities,
  };
}

export function applySkill(
  state: BattleState,
  caster: BattleEntity,
  skill: ShopSkill,
  aimX: number,
  aimZ: number,
  now: number,
): BattleState {
  if (!canCastSkill(state, caster, skill)) return state;

  let next = consumeSkillResources(state, caster, skill);
  const updatedCaster = next.entities.find((e) => e.id === caster.id);
  if (!updatedCaster) return state;

  const len = Math.sqrt(aimX * aimX + aimZ * aimZ) || 1;
  const dirX = aimX / len;
  const dirZ = aimZ / len;

  if (skill.kind === 'fireball') {
    const spawn = {
      x: updatedCaster.position.x + dirX * 0.8,
      y: updatedCaster.position.y + 1.2,
      z: updatedCaster.position.z + dirZ * 0.8,
    };
    const projectile: Projectile = {
      id: generateId(),
      ownerId: updatedCaster.id,
      ownerTeam: updatedCaster.teamId as SlotSide,
      position: spawn,
      velocity: { x: dirX * FIREBALL_SPEED, y: 0, z: dirZ * FIREBALL_SPEED },
      damage: FIREBALL_DAMAGE,
      radius: FIREBALL_RADIUS,
      ttl: FIREBALL_TTL,
    };
    let fireballState = appendVisualEvent(
      next,
      'fireball',
      'cast',
      spawn,
      FIREBALL_RADIUS * 2.5,
      now,
    );
    return { ...fireballState, projectiles: [...fireballState.projectiles, projectile] };
  }

  if (skill.kind === 'blink') {
    return applyBlink(next, updatedCaster, dirX, dirZ, now);
  }

  if (skill.kind === 'impulse') {
    let impulseState = appendVisualEvent(
      next,
      'impulse',
      'aoe',
      updatedCaster.position,
      IMPULSE_RADIUS,
      now,
    );

    for (const target of next.entities) {
      if (!target.alive) continue;
      if (!isHostile(updatedCaster.teamId, target.teamId)) continue;
      const d = distXZ(updatedCaster.position, target.position);
      if (d > IMPULSE_RADIUS) continue;

      const dx = target.position.x - updatedCaster.position.x;
      const dz = target.position.z - updatedCaster.position.z;
      const dlen = Math.sqrt(dx * dx + dz * dz) || 1;

      const result = applyDamage(impulseState, target, IMPULSE_DAMAGE, now, 'impulse');
      impulseState = result.state;
      const pushed = pushEntity(
        result.entity,
        dx / dlen,
        dz / dlen,
        IMPULSE_PUSH_FORCE,
      );
      impulseState = {
        ...impulseState,
        entities: impulseState.entities.map((e) => (e.id === pushed.id ? pushed : e)),
      };
    }

    return impulseState;
  }

  return next;
}

function clampBlinkDestination(
  x: number,
  z: number,
  arenaRadius: number,
): { x: number; z: number } {
  const dist = Math.hypot(x, z);
  const maxDist = Math.max(0, arenaRadius - PLAYER_COLLISION_RADIUS);
  if (dist <= maxDist) return { x, z };
  const scale = maxDist / dist;
  return { x: x * scale, z: z * scale };
}

function applyBlinkAoE(
  state: BattleState,
  center: Vec3,
  owner: BattleEntity,
  damage: number,
  radius: number,
  now: number,
  excludeId: string,
): BattleState {
  let next = appendVisualEvent(state, 'blink', 'aoe', center, radius, now);

  for (const target of next.entities) {
    if (!target.alive) continue;
    if (target.id === excludeId) continue;
    if (!isHostile(owner.teamId, target.teamId)) continue;
    if (distXZ(center, target.position) > radius) continue;

    const result = applyDamage(next, target, damage, now, 'blink');
    next = result.state;
    next = {
      ...next,
      entities: next.entities.map((e) => (e.id === result.entity.id ? result.entity : e)),
    };
  }
  return next;
}

function applyBlink(
  state: BattleState,
  caster: BattleEntity,
  dirX: number,
  dirZ: number,
  now: number,
): BattleState {
  const origin = caster.position;
  let next = applyBlinkAoE(
    state,
    origin,
    caster,
    BLINK_DAMAGE,
    BLINK_RADIUS,
    now,
    caster.id,
  );

  const rawDestX = origin.x + dirX * BLINK_RANGE;
  const rawDestZ = origin.z + dirZ * BLINK_RANGE;
  const clamped = clampBlinkDestination(rawDestX, rawDestZ, state.arenaRadius);
  const destination = { x: clamped.x, y: GROUND_Y, z: clamped.z };

  next = appendVisualEvent(
    next,
    'blink',
    'teleport',
    origin,
    BLINK_RADIUS,
    now,
    destination,
  );

  next = {
    ...next,
    entities: next.entities.map((entity) =>
      entity.id === caster.id
        ? {
            ...entity,
            position: destination,
            velocity: { x: 0, y: 0, z: 0 },
            isGrounded: true,
          }
        : entity,
    ),
  };

  const movedCaster = next.entities.find((e) => e.id === caster.id);
  if (!movedCaster) return next;

  return applyBlinkAoE(
    next,
    movedCaster.position,
    movedCaster,
    BLINK_DAMAGE,
    BLINK_RADIUS,
    now,
    movedCaster.id,
  );
}

function updateEntityPhysics(
  entity: BattleEntity,
  dt: number,
  moving = false,
): BattleEntity {
  let { x, y, z } = entity.position;
  let { x: vx, y: vy, z: vz } = entity.velocity;

  vy += GRAVITY * dt;
  x += vx * dt;
  y += vy * dt;
  z += vz * dt;

  let isGrounded = false;
  if (y <= GROUND_Y) {
    y = GROUND_Y;
    vy = 0;
    isGrounded = true;
  }

  if (!moving) {
    const friction = Math.pow(0.02, dt);
    vx *= friction;
    vz *= friction;
    if (Math.abs(vx) < 0.05) vx = 0;
    if (Math.abs(vz) < 0.05) vz = 0;
  }

  return {
    ...entity,
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
    isGrounded,
  };
}

function decayKnockback(value: number, dt: number): number {
  const next = value * Math.pow(0.06, dt);
  return Math.abs(next) < 0.08 ? 0 : next;
}

function applyPlayerMovement(
  entity: BattleEntity,
  input: PlayerInput | undefined,
  dt: number,
): BattleEntity {
  if (entity.type !== 'player' || !entity.alive) {
    const phys = updateEntityPhysics(entity, dt);
    return {
      ...phys,
      position: { ...phys.position, y: GROUND_Y },
      velocity: { x: phys.velocity.x, y: 0, z: phys.velocity.z },
      isGrounded: true,
    };
  }

  if (!input) {
    return updateEntityPhysics(entity, dt);
  }

  const speed = MOVE_SPEED + (entity.characterStats?.agility ?? 0) * 0.15;
  const moving = input.moveX !== 0 || input.moveZ !== 0;

  let knockbackX = decayKnockback(entity.knockbackX ?? 0, dt);
  let knockbackZ = decayKnockback(entity.knockbackZ ?? 0, dt);

  let vx = knockbackX;
  let vz = knockbackZ;
  if (moving) {
    vx += input.moveX * speed;
    vz += input.moveZ * speed;
  }

  let vy = entity.velocity.y;

  if (input.jump && entity.isGrounded) {
    vy = JUMP_FORCE;
  }

  let updated: BattleEntity = {
    ...entity,
    knockbackX,
    knockbackZ,
    velocity: { x: vx, y: vy, z: vz },
  };

  if (moving) {
    updated.facing = Math.atan2(input.moveX, input.moveZ);
  }

  return updateEntityPhysics(updated, dt, moving);
}

function resolveCollisions(entities: BattleEntity[]): BattleEntity[] {
  let result = entities.map((e) => ({ ...e }));

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]!;
        const b = result[j]!;
        if (!a.alive || !b.alive) continue;

        const mtv = getCollisionMTV(a, b);
        if (!mtv) continue;

        const separated = separateEntities(a, b, mtv);
        result[i] = separated.a;
        result[j] = separated.b;
      }
    }
  }

  return result;
}

function updateProjectiles(state: BattleState, dt: number, now: number): BattleState {
  let next = state;
  const remaining: Projectile[] = [];

  for (const proj of state.projectiles) {
    const position = {
      x: proj.position.x + proj.velocity.x * dt,
      y: proj.position.y + proj.velocity.y * dt,
      z: proj.position.z + proj.velocity.z * dt,
    };
    const ttl = proj.ttl - dt;

    if (ttl <= 0) continue;

    let hit = false;
    for (const target of next.entities) {
      if (!target.alive) continue;
      if (!isHostile(proj.ownerTeam, target.teamId)) continue;

      if (!projectileHitsEntity(position.x, position.z, proj.radius, target)) continue;

      const result = applyDamage(next, target, proj.damage, now, 'fireball');
      next = result.state;
      next = appendVisualEvent(
        next,
        'fireball',
        'impact',
        position,
        proj.radius * 4,
        now,
      );
      hit = true;
      break;
    }

    if (!hit) {
      remaining.push({ ...proj, position, ttl });
    }
  }

  return { ...next, projectiles: remaining };
}

function applyArenaHazard(state: BattleState, dt: number, now: number): BattleState {
  let next = state;

  for (const entity of state.entities) {
    if (!entity.alive) continue;
    const { x, z } = entity.position;

    const outsideArena = distXZ(entity.position, { x: 0, y: 0, z: 0 }) > state.arenaRadius;
    const onCorruptedCrystal =
      state.mapId === 'crystal_rift' &&
      isCrystalPlatformHazard(x, z, state.arenaRadius, state.corruptedPatches);

    if (!outsideArena && !onCorruptedCrystal) continue;

    const damage = LAVA_DAMAGE_PER_SEC * dt;
    const hp = Math.max(0, entity.hp - damage);
    const alive = hp > 0;
    const updated = { ...entity, hp, alive };

    next = {
      ...next,
      entities: next.entities.map((e) => (e.id === entity.id ? updated : e)),
    };

    const tickDamage = Math.round(damage);
    if (tickDamage >= 1) {
      next = appendDamageEvent(next, entity.id, tickDamage, entity.position, now);
    }
  }

  return next;
}

function growCorruptedPatches(state: BattleState, dt: number): BattleState {
  if (state.mapId !== 'crystal_rift' || state.corruptedPatches.length === 0) {
    return state;
  }

  const growth = getCrystalCorruptedPatchGrowthRate(state.mapId) * dt;

  return {
    ...state,
    corruptedPatches: state.corruptedPatches.map((patch) => {
      const maxRadius =
        patch.maxRadius ?? patch.radius * CRYSTAL_CORRUPTED_PATCH_MAX_RADIUS_MULTIPLIER;
      return {
        ...patch,
        maxRadius,
        radius: Math.min(maxRadius, patch.radius + growth),
      };
    }),
  };
}

function checkRoundEnd(state: BattleState): BattleState {
  const teamAPlayers = state.entities.filter(
    (e) => e.type === 'player' && e.teamId === 'teamA',
  );
  const teamBPlayers = state.entities.filter(
    (e) => e.type === 'player' && e.teamId === 'teamB',
  );

  const teamAAlive = teamAPlayers.some((e) => e.alive);
  const teamBAlive = teamBPlayers.some((e) => e.alive);

  if (teamAAlive && teamBAlive) return state;

  const winner: SlotSide = teamAAlive ? 'teamA' : 'teamB';
  const roundWins = {
    ...state.roundWins,
    [winner]: state.roundWins[winner] + 1,
  };

  let matchWinner: SlotSide | null = null;
  if (roundWins.teamA >= state.winsToWin) matchWinner = 'teamA';
  else if (roundWins.teamB >= state.winsToWin) matchWinner = 'teamB';

  const isMatchOver = matchWinner !== null;

  return {
    ...state,
    phase: isMatchOver ? 'match_end' : 'round_end',
    roundWinner: winner,
    matchWinner,
    roundWins,
    lastRoundMessage: isMatchOver
      ? `Match over — ${matchWinner === 'teamA' ? 'Alpha' : 'Beta'} Team wins (${roundWins.teamA}—${roundWins.teamB})`
      : `Round ${state.round} — ${winner === 'teamA' ? 'Alpha' : 'Beta'} Team wins (${roundWins.teamA}—${roundWins.teamB})`,
  };
}

export function tickBattle(
  state: BattleState,
  dt: number,
  inputs: Record<string, PlayerInput>,
  skillRequests: Array<{ entityId: string; skill: ShopSkill; aimX: number; aimZ: number }>,
  now: number,
): BattleState {
  if (state.phase !== 'combat') return state;

  let next: BattleState = {
    ...state,
    elapsedTime: state.elapsedTime + dt,
    arenaRadius: Math.max(
      state.arenaRadius - getArenaShrinkRate(state.mapId) * dt,
      getArenaMinRadius(state.mapId),
    ),
    damageEvents: state.damageEvents.filter((e) => now - e.createdAt < 1.2),
    visualEvents: state.visualEvents.filter((e) => now - e.createdAt < 1.2),
  };

  next = tickCombatResources(next, dt);

  for (const req of skillRequests) {
    const caster = next.entities.find((e) => e.id === req.entityId);
    if (!caster) continue;
    next = applySkill(next, caster, req.skill, req.aimX, req.aimZ, now);
  }

  next = {
    ...next,
    entities: next.entities.map((entity) => {
      const input = entity.playerId ? inputs[entity.playerId] : undefined;
      return applyPlayerMovement(entity, input, dt);
    }),
  };

  next = { ...next, entities: resolveCollisions(next.entities) };
  next = updateProjectiles(next, dt, now);
  next = growCorruptedPatches(next, dt);
  next = applyArenaHazard(next, dt, now);
  next = checkRoundEnd(next);

  return next;
}

export function allPlayersReady(state: BattleState): boolean {
  return state.players.every(
    (p) => p.isReady && isRoundStatDraftComplete(state, p),
  );
}

export function getLocalPlayerEntity(
  state: BattleState,
): BattleEntity | undefined {
  return state.entities.find(
    (e) => e.type === 'player' && e.playerId === state.localPlayerId,
  );
}

export function getEnemyEntities(
  state: BattleState,
  localTeam: SlotSide,
): BattleEntity[] {
  return state.entities.filter(
    (e) => e.alive && e.teamId !== localTeam && e.teamId !== 'neutral',
  );
}
