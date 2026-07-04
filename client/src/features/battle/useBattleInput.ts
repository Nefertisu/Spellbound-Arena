import { useEffect, useRef } from 'react';
import { SKILL_SLOT_COUNT } from '@spellbound/shared';
import { useBattleStore } from '../../stores/battleStore';
import type { PlayerInput } from '@spellbound/shared';

function worldMoveFromCamera(
  moveX: number,
  moveZ: number,
  camX: number,
  camZ: number,
): { x: number; z: number } {
  const len = Math.sqrt(camX * camX + camZ * camZ) || 1;
  const fx = camX / len;
  const fz = camZ / len;
  const rx = fz;
  const rz = -fx;

  const wx = -moveZ * fx - moveX * rx;
  const wz = -moveZ * fz - moveX * rz;

  const wlen = Math.sqrt(wx * wx + wz * wz);
  if (wlen > 1) return { x: wx / wlen, z: wz / wlen };
  return { x: wx, z: wz };
}

function getSkillSlotIndex(code: string): number | null {
  if (code.startsWith('Digit')) {
    const digit = Number(code.replace('Digit', ''));
    if (digit === 0) return 9;
    if (digit >= 1 && digit <= 9) return digit - 1;
    return null;
  }
  if (code === 'Minus') return 10;
  if (code === 'Equal') return 11;
  return null;
}

const ZERO_INPUT: PlayerInput = {
  moveX: 0,
  moveZ: 0,
  jump: false,
  skillIndex: null,
  aimX: 0,
  aimZ: 1,
};

export function useBattleInput(localPlayerId: string | undefined, enabled = true) {
  const pressed = useRef(new Set<string>());
  const jumpQueued = useRef(false);

  useEffect(() => {
    if (!localPlayerId || enabled) return;
    pressed.current.clear();
    jumpQueued.current = false;
    useBattleStore.getState().setInput(localPlayerId, ZERO_INPUT);
  }, [localPlayerId, enabled]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!enabled) return;

      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
        pressed.current.add(e.code);
        if (e.code === 'Space') jumpQueued.current = true;
      }

      const index = getSkillSlotIndex(e.code);
      if (index != null && localPlayerId) {
        if (index < 0 || index >= SKILL_SLOT_COUNT) return;

        const battle = useBattleStore.getState().battle;
        if (!battle || battle.phase !== 'combat') return;

        const meta = battle.players.find((p) => p.playerId === localPlayerId);
        const entity = battle.entities.find(
          (en) => en.playerId === localPlayerId && en.alive,
        );
        const skill = meta?.equippedSkills[index];
        if (!entity || !skill) return;

        const { cameraForward } = useBattleStore.getState();
        useBattleStore.getState().queueSkill(
          entity.id,
          skill,
          cameraForward.x,
          cameraForward.z,
        );
      }
    };

    const onUp = (e: KeyboardEvent) => {
      pressed.current.delete(e.code);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [localPlayerId, enabled]);

  useEffect(() => {
    if (!localPlayerId) return;

    let frame = 0;
    const loop = () => {
      if (!enabled) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const p = pressed.current;
      let moveX = 0;
      let moveZ = 0;
      if (p.has('KeyA')) moveX -= 1;
      if (p.has('KeyD')) moveX += 1;
      if (p.has('KeyW')) moveZ -= 1;
      if (p.has('KeyS')) moveZ += 1;

      const rawLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (rawLen > 0) {
        moveX /= rawLen;
        moveZ /= rawLen;
      }

      const { cameraForward } = useBattleStore.getState();
      const world = worldMoveFromCamera(moveX, moveZ, cameraForward.x, cameraForward.z);

      const input: PlayerInput = {
        moveX: world.x,
        moveZ: world.z,
        jump: jumpQueued.current,
        skillIndex: null,
        aimX: cameraForward.x,
        aimZ: cameraForward.z,
      };

      jumpQueued.current = false;
      useBattleStore.getState().setInput(localPlayerId, input);
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [localPlayerId, enabled]);
}
