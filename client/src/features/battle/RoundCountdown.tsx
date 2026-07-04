import { useEffect, useState } from 'react';
import { INTERMISSION_COUNTDOWN_SEC, type SlotSide } from '@spellbound/shared';
import { useBattleStore } from '../../stores/battleStore';
import styles from './RoundCountdown.module.scss';

const TEAM_NAMES: Record<SlotSide, string> = {
  teamA: 'Alpha Team',
  teamB: 'Beta Team',
};

export function RoundCountdown() {  const battle = useBattleStore((s) => s.battle);
  const continueAfterRound = useBattleStore((s) => s.continueAfterRound);
  const [secondsLeft, setSecondsLeft] = useState(INTERMISSION_COUNTDOWN_SEC);

  useEffect(() => {
    if (battle?.phase !== 'round_end') return;

    setSecondsLeft(INTERMISSION_COUNTDOWN_SEC);
    const startedAt = performance.now();

    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const next = Math.max(0, INTERMISSION_COUNTDOWN_SEC - Math.floor(elapsed));
      setSecondsLeft(next);

      if (next <= 0) {
        window.clearInterval(timer);
        continueAfterRound();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [battle?.phase, battle?.round, continueAfterRound]);

  if (battle?.phase !== 'round_end') return null;

  if (secondsLeft <= 0) return null;

  const winnerName = battle.roundWinner
    ? TEAM_NAMES[battle.roundWinner]
    : null;

  return (
    <div className={styles.overlay}>
      <div className={styles.stack}>
        {winnerName && (
          <span className={styles.winner} key={winnerName}>
            {winnerName} wins
          </span>
        )}
        <span className={styles.number} key={secondsLeft}>
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}