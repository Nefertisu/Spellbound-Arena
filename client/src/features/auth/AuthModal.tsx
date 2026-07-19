import { useEffect, useRef, useState } from 'react';
import { loginUser, registerUser } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { GameButton } from '../../components/ui/GameButton';
import { GameInput } from '../../components/ui/GameInput';
import { GamePanel } from '../../components/ui/GamePanel';
import styles from './AuthModal.module.scss';

type AuthMode = 'login' | 'register';

export function AuthModal() {
  const { isAuthenticated, login } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      emailRef.current?.focus();
    }
  }, [isAuthenticated, mode]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result =
      mode === 'login'
        ? await loginUser({ email, password })
        : await registerUser({ email, name, password });

    if (!result.success) {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    login(result.user);
    setIsSubmitting(false);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} />
      <GamePanel
        title={mode === 'login' ? 'Sign In' : 'Create Account'}
        subtitle="Enter the arena"
        width="380px"
        className={styles.panel}
      >
        <form onSubmit={handleSubmit}>
          <GameInput
            ref={emailRef}
            variant="plain"
            label="Email"
            type="text"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />

          {mode === 'register' && (
            <GameInput
              variant="plain"
              label="Name"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}

          <GameInput
            variant="plain"
            label="Password"
            type="password"
            placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <GameButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </GameButton>
          </div>

          <p className={styles.hint}>
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button type="button" className={styles.link} onClick={() => switchMode('register')}>
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className={styles.link} onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </GamePanel>
    </div>
  );
}
