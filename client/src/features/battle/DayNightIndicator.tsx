import { getDayNightDialPosition, isDaytime } from '@spellbound/shared';
import styles from './DayNightIndicator.module.scss';

interface DayNightIndicatorProps {
  dayTime: number;
  compact?: boolean;
}

export function DayNightIndicator({ dayTime, compact = false }: DayNightIndicatorProps) {
  const daytime = isDaytime(dayTime);
  const marker = getDayNightDialPosition(dayTime);
  const dayArc = daytime ? 1 : 0.5 + Math.sin(dayTime * Math.PI * 2) * 0.5;

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      <div className={styles.dial}>
        <svg className={styles.svg} viewBox="0 0 100 54" aria-hidden>
          <defs>
            <linearGradient id="dayNightArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2a3558" />
              <stop offset="45%" stopColor="#6a7ab0" />
              <stop offset="55%" stopColor="#e8c860" />
              <stop offset="100%" stopColor="#8ec8ff" />
            </linearGradient>
          </defs>
          <path
            d="M 8 46 A 42 42 0 0 1 92 46"
            className={styles.track}
          />
          <path
            d="M 8 46 A 42 42 0 0 1 92 46"
            className={styles.arc}
            style={{ opacity: 0.35 + dayArc * 0.45 }}
            stroke="url(#dayNightArc)"
          />
          <circle
            cx={marker.x}
            cy={marker.y}
            r="5.5"
            className={daytime ? styles.sunMarker : styles.moonMarker}
          />
        </svg>
        <span className={`${styles.phase} ${daytime ? styles.day : styles.night}`}>
          {daytime ? 'Day' : 'Night'}
        </span>
      </div>
    </div>
  );
}
