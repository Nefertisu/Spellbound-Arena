import type { ReactNode } from 'react';
import type { StatKey } from '@spellbound/shared';
import styles from './StatIcon.module.scss';

const STAT_ICON_COLORS: Record<StatKey, string> = {
  agility: '#5cb85c',
  strength: '#c9302c',
  intelligence: '#5b9bd5',
  fury: '#d9534f',
  statusResistance: '#9b8ec4',
  pushResistance: '#c9a227',
};

interface StatIconProps {
  stat: StatKey;
  size?: number;
  className?: string;
}

export function StatIcon({ stat, size = 20, className = '' }: StatIconProps) {
  const color = STAT_ICON_COLORS[stat];

  const icons: Record<StatKey, ReactNode> = {
    agility: (
      <path
        d="M10 2 L14 8 L18 6 L14 12 L16 18 L10 14 L4 18 L6 12 L2 6 L6 8 Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
    ),
    strength: (
      <>
        <path
          d="M6 8 C6 5 8 3 10 3 C12 3 14 5 14 8 L14 12 L6 12 Z"
          fill={color}
        />
        <rect x="8" y="12" width="4" height="6" rx="1" fill={color} />
        <path d="M4 10 L6 10 L6 14 L4 14 Z M14 10 L16 10 L16 14 L14 14 Z" fill={color} />
      </>
    ),
    intelligence: (
      <>
        <circle cx="10" cy="8" r="5" fill="none" stroke={color} strokeWidth="1.5" />
        <circle cx="10" cy="8" r="2" fill={color} />
        <path d="M10 13 L10 17 M7 15 L13 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    fury: (
      <>
        <path
          d="M10 3 L12 9 L18 9 L13 13 L15 19 L10 15 L5 19 L7 13 L2 9 L8 9 Z"
          fill={color}
        />
        <path d="M8 11 L10 9 L12 11" stroke="#1a0808" strokeWidth="1" fill="none" />
      </>
    ),
    statusResistance: (
      <>
        <path
          d="M10 2 L16 5 L16 11 C16 15 13 17 10 18 C7 17 4 15 4 11 L4 5 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        <path d="M8 10 L9.5 12 L12 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
    pushResistance: (
      <>
        <rect x="7" y="4" width="6" height="10" rx="1" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M5 8 L7 8 M13 8 L15 8 M5 12 L7 12 M13 12 L15 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="14" width="4" height="3" fill={color} />
      </>
    ),
  };

  return (
    <svg
      className={`${styles.icon} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      {icons[stat]}
    </svg>
  );
}
