import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './GameInput.module.scss';

interface GameInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const GameInput = forwardRef<HTMLInputElement, GameInputProps>(
  function GameInput({ label, id, ...props }, ref) {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={styles.group}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <input ref={ref} id={inputId} className={styles.input} {...props} />
      </div>
    );
  },
);
