import { STAT_KEYS, STAT_LABELS, type CharacterStats, type StatKey } from '@spellbound/shared';
import { StatIcon } from './StatIcon';
import styles from './StatDisplay.module.scss';

interface StatDisplayProps {
  stats: CharacterStats;
  layout?: 'grid' | 'row' | 'compact';
  showLabels?: boolean;
  iconSize?: number;
  className?: string;
}

interface StatValueProps {
  stat: StatKey;
  value: number;
  showLabel?: boolean;
  iconSize?: number;
  compact?: boolean;
  className?: string;
}

export function StatValue({
  stat,
  value,
  showLabel = false,
  iconSize = 18,
  compact = false,
  className = '',
}: StatValueProps) {
  return (
    <div
      className={`${styles.statValue} ${compact ? styles.compact : ''} ${className}`}
      title={STAT_LABELS[stat]}
    >
      <StatIcon stat={stat} size={iconSize} />
      {showLabel && <span className={styles.label}>{STAT_LABELS[stat]}</span>}
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export function StatDisplay({
  stats,
  layout = 'grid',
  showLabels = false,
  iconSize = 18,
  className = '',
}: StatDisplayProps) {
  const layoutClass =
    layout === 'row' ? styles.row : layout === 'compact' ? styles.compactGrid : styles.grid;

  return (
    <div className={`${layoutClass} ${className}`}>
      {STAT_KEYS.map((key) => (
        <StatValue
          key={key}
          stat={key}
          value={stats[key]}
          showLabel={showLabels}
          iconSize={iconSize}
          compact={layout === 'compact'}
        />
      ))}
    </div>
  );
}
