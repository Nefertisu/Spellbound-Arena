import { useEffect } from 'react';

export function useBattlePauseMenu(
  enabled: boolean,
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();

      if (isOpen) {
        onClose();
      } else {
        onOpen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, isOpen, onOpen, onClose]);
}
