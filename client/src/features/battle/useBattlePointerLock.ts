import { useEffect } from 'react';
import { useBattleStore } from '../../stores/battleStore';

const LOOK_SENSITIVITY = 0.0025;
const ZOOM_SENSITIVITY = 0.006;

export function useBattlePointerLock(isCombat: boolean) {
  const addCameraRotation = useBattleStore((s) => s.addCameraRotation);
  const addCameraZoom = useBattleStore((s) => s.addCameraZoom);

  useEffect(() => {
    if (!isCombat) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      addCameraRotation(-e.movementX * LOOK_SENSITIVITY, -e.movementY * LOOK_SENSITIVITY);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      addCameraZoom(e.deltaY * ZOOM_SENSITIVITY);
    };

    const lockPointer = () => {
      if (document.pointerLockElement) return;
      document.body.requestPointerLock();
    };

    const onPointerLockChange = () => {
      if (!document.pointerLockElement && isCombat) {
        // Re-lock on next click if still in combat
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('click', lockPointer);

    // Attempt lock when combat starts
    lockPointer();

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('click', lockPointer);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [isCombat, addCameraRotation, addCameraZoom]);
}