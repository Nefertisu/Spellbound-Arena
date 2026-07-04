import { GameButton } from '../../components/ui/GameButton';
import { GamePanel } from '../../components/ui/GamePanel';
import styles from './BattlePauseMenu.module.scss';

interface BattlePauseMenuProps {
  onResume: () => void;
  onLeave: () => void;
}

export function BattlePauseMenu({ onResume, onLeave }: BattlePauseMenuProps) {
  return (
    <div className={styles.overlay}>
      <GamePanel title="Game Menu" subtitle="Match paused" className={styles.panel}>
        <p className={styles.hint}>
          Press <kbd className={styles.key}>Esc</kbd> to resume.
        </p>

        <div className={styles.actions}>
          <GameButton variant="primary" onClick={onResume}>
            Resume
          </GameButton>
          <GameButton variant="ghost" onClick={onLeave}>
            Leave Match
          </GameButton>
        </div>
      </GamePanel>
    </div>
  );
}
