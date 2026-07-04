import styles from './ResourceGlobe.module.scss';

export interface ResourceCornerDisplay {
  text: string;
  mode: 'regen' | 'loss';
}

interface ResourceGlobeProps {
  variant: 'hp' | 'mana';
  current: number;
  max: number;
  label: string;
  corner?: ResourceCornerDisplay;
  compact?: boolean;
  embedded?: boolean;
}

export function ResourceGlobe({
  variant,
  current,
  max,
  label,
  corner,
  compact = false,
  embedded = false,
}: ResourceGlobeProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const wrapClass = [
    styles.globeWrap,
    compact ? styles.compact : '',
    embedded ? styles.embedded : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      <div className={`${styles.globe} ${styles[variant]}`}>
        <div className={styles.fillTrack}>
          <div className={styles.fill} style={{ height: `${ratio * 100}%` }} />
        </div>
        <div className={styles.glass} />
        <span className={styles.value}>{Math.ceil(current)}</span>
      </div>

      {corner && (
        <span
          className={`${styles.cornerBadge} ${styles[`corner${corner.mode === 'loss' ? 'Loss' : 'Regen'}`]} ${styles[variant]}`}
        >
          {corner.text}
        </span>
      )}

      {!embedded && <span className={styles.label}>{label}</span>}
    </div>
  );
}