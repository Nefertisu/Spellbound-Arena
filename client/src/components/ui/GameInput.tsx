import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import styles from './GameInput.module.scss';

interface GameInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Plain system font — text looks exactly as typed (for credentials, etc.). */
  variant?: 'default' | 'plain';
  /** Show eye toggle for password fields. Defaults to true when type="password". */
  passwordToggle?: boolean;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
      />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.7 6.7C4.1 8.2 2.3 10.5 2 12s3.5 6 10 6c1.8 0 3.4-.4 4.8-1"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.3 17.3c2.6-1.5 4.4-3.8 4.7-5.3-.3-1.5-3.5-6-10-6-1 0-1.9.1-2.7.4"
      />
    </svg>
  );
}

export const GameInput = forwardRef<HTMLInputElement, GameInputProps>(
  function GameInput(
    {
      label,
      id,
      variant = 'default',
      className,
      type,
      passwordToggle,
      ...props
    },
    ref,
  ) {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    const showPasswordToggle = passwordToggle ?? type === 'password';
    const resolvedType =
      showPasswordToggle && passwordVisible ? 'text' : type;

    const inputClassName = [
      styles.input,
      variant === 'plain' ? styles.plain : '',
      showPasswordToggle ? styles.withToggle : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.group}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <div className={styles.inputWrap}>
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={inputClassName}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setPasswordVisible((value) => !value)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
      </div>
    );
  },
);
