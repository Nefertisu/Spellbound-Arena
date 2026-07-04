import { useState } from 'react';
import {
  canCreateCharacter,
  getRemainingPoints,
  MAX_CHARACTERS_PER_USER,
  type CharacterStats,
} from '@spellbound/shared';
import { CharacterPreview } from '../../components/three/CharacterPreview';
import { GameButton } from '../../components/ui/GameButton';
import { GameInput } from '../../components/ui/GameInput';
import { StatAllocator, useStatAllocatorState } from './StatAllocator';
import styles from './CharacterCreator.module.scss';

interface CharacterCreatorProps {
  existingCount: number;
  onCreated: () => void;
  onCancel: () => void;
  onCreate: (
    name: string,
    stats: CharacterStats,
  ) => { success: true } | { success: false; message: string };
}

export function CharacterCreator({
  existingCount,
  onCreated,
  onCancel,
  onCreate,
}: CharacterCreatorProps) {
  const [name, setName] = useState('');
  const [stats, setStats] = useStatAllocatorState();
  const [error, setError] = useState<string | null>(null);

  if (!canCreateCharacter(existingCount)) {
    return (
      <div className={styles.limitReached}>
        <h2 className={styles.title}>Limit Reached</h2>
        <p className={styles.limitText}>
          You already have {MAX_CHARACTERS_PER_USER} characters.
        </p>
        <div className={styles.actions}>
          <GameButton variant="ghost" onClick={onCancel}>
            Back
          </GameButton>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = onCreate(name, stats);
    if (!result.success) {
      setError(result.message);
      return;
    }

    onCreated();
  };

  const canSubmit = getRemainingPoints(stats) === 0 && name.trim().length > 0;

  return (
    <div className={styles.creatorScreen}>
      <header className={styles.header}>
        <h2 className={styles.title}>Forge a Champion</h2>
        <span className={styles.subtitle}>
          {existingCount}/{MAX_CHARACTERS_PER_USER} characters
        </span>
      </header>

      <form onSubmit={handleSubmit} className={styles.creator}>
        <div className={styles.formCol}>
          <GameInput
            label="Character Name"
            placeholder="Enter a name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />

          <StatAllocator stats={stats} onChange={setStats} />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <GameButton type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </GameButton>
            <GameButton type="submit" variant="primary" disabled={!canSubmit}>
              Create
            </GameButton>
          </div>
        </div>

        <div className={styles.previewCol}>
          <div className={styles.previewStage}>
            <CharacterPreview stats={stats} size="full" colorizeByStats={false} />
          </div>
        </div>
      </form>
    </div>
  );
}
