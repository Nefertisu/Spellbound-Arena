import { useState } from 'react';
import {
  canDecrementStat,
  canIncrementStatWithBudget,
  createEmptyStats,
  decrementStat,
  getRemainingAllocatablePoints,
  incrementStat,
  INITIAL_STAT_POINTS,
  STAT_DESCRIPTIONS,
  STAT_KEYS,
  STAT_LABELS,
  type CharacterStats,
  type StatKey,
} from '@spellbound/shared';
import { StatIcon } from '../../components/ui/StatIcon';
import styles from './StatAllocator.module.scss';

interface StatAllocatorProps {
  stats: CharacterStats;
  onChange: (stats: CharacterStats) => void;
  pointBudget?: number;
  compact?: boolean;
  title?: string;
  /** When set, shows base + green bonus breakdown instead of draft-only values */
  baseStats?: CharacterStats;
  committedBonusStats?: CharacterStats;
}

export function StatAllocator({
  stats,
  onChange,
  pointBudget = INITIAL_STAT_POINTS,
  compact = false,
  title,
  baseStats,
  committedBonusStats,
}: StatAllocatorProps) {
  const remaining = getRemainingAllocatablePoints(stats, pointBudget);
  const showBreakdown = baseStats != null && committedBonusStats != null;
  const wrapClass = compact
    ? `${styles.wrap} ${styles.compact} ${showBreakdown ? styles.withBreakdown : ''}`
    : `${styles.wrap} ${showBreakdown ? styles.withBreakdown : ''}`;

  const handleIncrement = (key: StatKey) => {
    const next = incrementStat(stats, key, pointBudget);
    if (next) onChange(next);
  };

  const handleDecrement = (key: StatKey) => {
    const next = decrementStat(stats, key);
    if (next) onChange(next);
  };

  return (
    <div className={wrapClass}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <p className={`${styles.remaining} ${remaining === 0 ? styles.complete : ''}`}>
        Points remaining: <strong>{remaining}</strong> / {pointBudget}
      </p>

      {STAT_KEYS.map((key) => {
        const baseValue = showBreakdown ? baseStats[key] : 0;
        const committedBonus = showBreakdown ? committedBonusStats[key] : 0;
        const draftBonus = stats[key];
        const bonusTotal = committedBonus + draftBonus;

        return (
        <div key={key} className={styles.row}>
          <div className={styles.info}>
            <div className={styles.nameRow}>
              <StatIcon stat={key} size={compact ? 18 : 22} />
              <span className={styles.name}>{STAT_LABELS[key]}</span>
            </div>
            {!compact && <div className={styles.desc}>{STAT_DESCRIPTIONS[key]}</div>}
          </div>
          {showBreakdown ? (
            <div className={styles.valueBreakdown}>
              <span className={styles.baseValue}>{baseValue}</span>
              {bonusTotal > 0 && (
                <>
                  <span className={styles.plusSign}>+</span>
                  <span className={styles.bonusValue}>{bonusTotal}</span>
                </>
              )}
            </div>
          ) : (
            <div className={styles.value}>{stats[key]}</div>
          )}
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.statBtn}
              disabled={!canDecrementStat(stats, key)}
              onClick={() => handleDecrement(key)}
              aria-label={`Decrease ${STAT_LABELS[key]}`}
            >
              −
            </button>
            <button
              type="button"
              className={styles.statBtn}
              disabled={!canIncrementStatWithBudget(stats, pointBudget)}
              onClick={() => handleIncrement(key)}
              aria-label={`Increase ${STAT_LABELS[key]}`}
            >
              +
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

export function useStatAllocatorState() {
  return useState<CharacterStats>(createEmptyStats);
}
