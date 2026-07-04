import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './GameButton.module.scss';

type GameButtonVariant = 'default' | 'primary' | 'ghost';
type GameButtonSize = 'default' | 'small';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export function GameButton({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  className = '',
  children,
  ...props
}: GameButtonProps) {
  const classes = [
    styles.btn,
    variant === 'primary' ? styles.primary : '',
    variant === 'ghost' ? styles.ghost : '',
    size === 'small' ? styles.small : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
