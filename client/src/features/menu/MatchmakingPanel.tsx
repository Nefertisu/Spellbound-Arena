import { useEffect, useState } from 'react';
import {
  BOT_DIFFICULTIES,
  botDifficultyLabel,
  MATCH_MODES,
  matchModeLabel,
  OPPONENT_TYPES,
  opponentTypeLabel,
  type BotDifficulty,
  type MatchMode,
  type OpponentType,
} from '@spellbound/shared';
import { useGameStore } from '../../stores/gameStore';
import { GameButton } from '../../components/ui/GameButton';
import styles from './MatchmakingPanel.module.scss';

interface MatchmakingPanelProps {
  disabled?: boolean;
  onBack: () => void;
  onSearch: (options: {
    mode: MatchMode;
    opponentType: OpponentType;
    botDifficulty: BotDifficulty;
  }) => Promise<void>;
}

export function MatchmakingPanel({
  disabled = false,
  onBack,
  onSearch,
}: MatchmakingPanelProps) {
  const [mode, setMode] = useState<MatchMode>('1v1');
  const [opponentType, setOpponentType] = useState<OpponentType>('bots');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('passive');
  const [isSearching, setIsSearching] = useState(false);
  const [statusText, setStatusText] = useState('');
  const queueSize = useGameStore((s) => s.queueSize);
  const queueRequired = useGameStore((s) => s.queueRequired);

  useEffect(() => {
    if (!isSearching || queueRequired === 0) return;
    setStatusText(`In queue ${queueSize}/${queueRequired}...`);
  }, [isSearching, queueSize, queueRequired]);

  const handleSearch = async () => {
    if (disabled || isSearching) return;

    setIsSearching(true);
    setStatusText('Searching for match...');

    try {
      await onSearch({ mode, opponentType, botDifficulty });
      setStatusText('Match found!');
    } catch {
      setStatusText('');
      setIsSearching(false);
    }
  };

  return (
    <div className={styles.panel}>
      <button type="button" className={styles.backBtn} onClick={onBack} disabled={isSearching}>
        ← Back
      </button>

      <div className={styles.optionGroup}>
        <span className={styles.optionLabel}>Battle Size</span>
        <div className={styles.segments} role="group" aria-label="Battle size">
          {MATCH_MODES.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.segment} ${mode === value ? styles.segmentActive : ''}`}
              disabled={isSearching}
              onClick={() => setMode(value)}
            >
              {matchModeLabel(value)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.optionGroup}>
        <span className={styles.optionLabel}>Opponents</span>
        <div className={styles.segments} role="group" aria-label="Opponent type">
          {OPPONENT_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.segment} ${opponentType === value ? styles.segmentActive : ''}`}
              disabled={isSearching}
              onClick={() => setOpponentType(value)}
            >
              {opponentTypeLabel(value)}
            </button>
          ))}
        </div>
      </div>

      {opponentType === 'bots' && (
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>Bot Difficulty</span>
          <div className={styles.segments} role="group" aria-label="Bot difficulty">
            {BOT_DIFFICULTIES.map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.segment} ${botDifficulty === value ? styles.segmentActive : ''}`}
                disabled={isSearching}
                onClick={() => setBotDifficulty(value)}
              >
                {botDifficultyLabel(value)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.searchBlock}>
        {isSearching && (
          <div className={styles.searching}>
            <span className={styles.spinner} aria-hidden />
            <span className={styles.searchText}>{statusText}</span>
          </div>
        )}

        <GameButton
          variant="primary"
          fullWidth
          disabled={disabled || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? 'Searching...' : 'Search Match'}
        </GameButton>
      </div>

      <p className={styles.hint}>
        {opponentType === 'bots'
          ? 'Bots fill all empty slots on both teams after a match is found.'
          : 'You will enter a lobby and wait for other players to join.'}
      </p>
    </div>
  );
}
