import { useEffect } from 'react';
import { formatRating, formatWinRate } from '@spellbound/shared';
import { useAuthStore } from '../../stores/authStore';
import { useRatingStore } from '../../stores/ratingStore';
import { GameButton } from '../../components/ui/GameButton';
import styles from './RatingScreen.module.scss';

interface RatingScreenProps {
  onBack: () => void;
}

export function RatingScreen({ onBack }: RatingScreenProps) {
  const user = useAuthStore((s) => s.user);
  const status = useRatingStore((s) => s.status);
  const data = useRatingStore((s) => s.data);
  const error = useRatingStore((s) => s.error);
  const loadRating = useRatingStore((s) => s.loadRating);

  useEffect(() => {
    if (!user) return;
    void loadRating(user.id, user.token);
  }, [user, loadRating]);

  const handleRefresh = () => {
    if (!user) return;
    void loadRating(user.id, user.token);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Rating</h2>
          <p className={styles.subtitle}>
            Your competitive stats are loaded from the server. Mock data is shown until the backend is connected.
          </p>
        </div>
        <GameButton variant="ghost" onClick={onBack}>
          Back to Menu
        </GameButton>
      </header>

      <div className={styles.content}>
        {status === 'loading' && <p className={styles.loading}>Loading rating...</p>}

        {status === 'error' && (
          <div className={styles.card}>
            <p className={styles.error}>{error ?? 'Failed to load rating.'}</p>
            <GameButton onClick={handleRefresh}>Retry</GameButton>
          </div>
        )}

        {status === 'ready' && data && (
          <article className={styles.card}>
            <div className={styles.ratingHero}>
              <div>
                <p className={styles.ratingValue}>{formatRating(data.rating)}</p>
                <p className={styles.ratingLabel}>Current rating</p>
              </div>
              {data.rankTier && <span className={styles.tierBadge}>{data.rankTier}</span>}
            </div>

            <div className={styles.statsGrid}>
              <div className={`${styles.statBox} ${styles.statBoxHighlight}`}>
                <span className={`${styles.statValue} ${styles.statValueAccent}`}>
                  {formatWinRate(data.winRate)}
                </span>
                <span className={styles.statCaption}>Win rate</span>
              </div>

              <div className={styles.statBox}>
                <span className={styles.statValue}>{data.wins}</span>
                <span className={styles.statCaption}>Wins</span>
              </div>

              <div className={styles.statBox}>
                <span className={styles.statValue}>{data.losses}</span>
                <span className={styles.statCaption}>Losses</span>
              </div>

              <div className={styles.statBox}>
                <span className={styles.statValue}>{data.matchesPlayed}</span>
                <span className={styles.statCaption}>Matches</span>
              </div>

              {data.peakRating != null && (
                <div className={styles.statBox}>
                  <span className={styles.statValue}>{formatRating(data.peakRating)}</span>
                  <span className={styles.statCaption}>Peak rating</span>
                </div>
              )}

              {data.draws != null && data.draws > 0 && (
                <div className={styles.statBox}>
                  <span className={styles.statValue}>{data.draws}</span>
                  <span className={styles.statCaption}>Draws</span>
                </div>
              )}
            </div>

            <p className={styles.meta}>
              {data.seasonId ? `Season: ${data.seasonId} · ` : ''}
              Updated: {new Date(data.updatedAt).toLocaleString('en-US')}
            </p>
          </article>
        )}
      </div>

      <footer className={styles.footer}>
        <p className={styles.hint}>Stats sync from backend after each ranked match.</p>
        <GameButton size="small" variant="ghost" onClick={handleRefresh} disabled={status === 'loading'}>
          Refresh
        </GameButton>
      </footer>
    </div>
  );
}
