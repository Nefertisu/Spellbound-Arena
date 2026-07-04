import type { ReactNode } from 'react';
import styles from './GamePanel.module.scss';

interface GamePanelProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  width?: string;
}

export function GamePanel({
  title,
  subtitle,
  children,
  className = '',
  compact = false,
  width,
}: GamePanelProps) {
  const classes = [styles.panel, compact ? styles.compact : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={{ width }}>
      <div className={styles.inner}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
