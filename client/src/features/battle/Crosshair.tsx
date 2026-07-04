import styles from './Crosshair.module.scss';

export function Crosshair() {
  return (
    <div className={styles.crosshair} aria-hidden>
      <span className={`${styles.line} ${styles.lineTop}`} />
      <span className={`${styles.line} ${styles.lineBottom}`} />
      <span className={`${styles.line} ${styles.lineLeft}`} />
      <span className={`${styles.line} ${styles.lineRight}`} />
      <span className={styles.dot} />
    </div>
  );
}
