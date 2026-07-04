import type { SkillKind } from '@spellbound/shared';
import { getSkillDefinitions } from '@spellbound/shared';
import { GameButton } from '../../components/ui/GameButton';
import styles from './SkillGallery.module.scss';

interface SkillGalleryProps {
  onBack: () => void;
}

const CARD_CLASS: Record<SkillKind, string> = {
  fireball: styles.cardFireball,
  impulse: styles.cardImpulse,
  blink: styles.cardBlink,
};

export function SkillGallery({ onBack }: SkillGalleryProps) {
  const skills = getSkillDefinitions();

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Skill Gallery</h2>
          <p className={styles.subtitle}>
            Read how each ability works and review its combat stats. Shop prices are fixed per skill.
          </p>
        </div>
        <GameButton variant="ghost" onClick={onBack}>
          Back to Menu
        </GameButton>
      </header>

      <div className={styles.grid}>
        {skills.map((skill) => (
          <article
            key={skill.kind}
            className={`${styles.card} ${CARD_CLASS[skill.kind]}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.icon} aria-hidden>
                {skill.icon}
              </div>
              <div>
                <h3 className={styles.cardTitle}>{skill.label}</h3>
                <p className={styles.cardKind}>{skill.kind}</p>
              </div>
            </div>

            <p className={styles.description}>{skill.description}</p>
            <p className={styles.playstyle}>{skill.playstyle}</p>

            <div>
              <p className={styles.statsTitle}>How it works</p>
              <ul className={styles.mechanicsList}>
                {skill.mechanics.map((line) => (
                  <li key={line} className={styles.mechanicsItem}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={styles.statsTitle}>Stats</p>
              <div className={styles.statsGrid}>
                {skill.stats.map((stat) => (
                  <div key={stat.label} className={styles.statRow}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <span className={styles.statValue}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className={styles.footer}>
        <p className={styles.hint}>
          Skills are bought during round shop. Equip up to 12 and cast with keys 1–9, 0, -, =.
        </p>
      </footer>
    </div>
  );
}
