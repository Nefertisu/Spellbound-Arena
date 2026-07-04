import { useEffect } from 'react';
import { useBattleStore } from '../../stores/battleStore';

const LEAVE_MATCH_MESSAGE = 'Are you sure you want to leave?';

export function useMatchLeaveGuard() {
  const battle = useBattleStore((s) => s.battle);
  const isActiveMatch = Boolean(battle && battle.phase !== 'match_end');

  useEffect(() => {
    if (!isActiveMatch) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = LEAVE_MATCH_MESSAGE;
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isActiveMatch]);

  const confirmLeave = () => {
    if (!isActiveMatch) return true;
    return window.confirm(LEAVE_MATCH_MESSAGE);
  };

  return { isActiveMatch, confirmLeave };
}
