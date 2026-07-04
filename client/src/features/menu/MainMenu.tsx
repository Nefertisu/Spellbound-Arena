import { useState } from 'react';
import type { BotDifficulty, MatchMode, OpponentType } from '@spellbound/shared';
import { useAuthStore } from '../../stores/authStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import { CharacterPreview } from '../../components/three/CharacterPreview';
import { GameButton } from '../../components/ui/GameButton';
import { MatchmakingPanel } from './MatchmakingPanel';
import styles from './MainMenu.module.scss';

export function MainMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const getActiveCharacter = useCharacterStore((s) => s.getActiveCharacter);
  const setScreen = useGameStore((s) => s.setScreen);
  const openCharacters = useGameStore((s) => s.openCharacters);
  const findMatch = useGameStore((s) => s.findMatch);
  const [showMatchmaking, setShowMatchmaking] = useState(false);

  const activeCharacter = user ? getActiveCharacter(user.id) : null;

  const handleSearch = async (options: {
    mode: MatchMode;
    opponentType: OpponentType;
    botDifficulty: BotDifficulty;
  }) => {
    if (!user || !activeCharacter) return;
    await findMatch(
      options.mode,
      options.opponentType,
      options.botDifficulty,
      user.id,
      activeCharacter,
    );
  };

  return (
    <div className={styles.menu}>
      <div className={styles.embers} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={styles.ember}
            style={{
              left: `${8 + i * 8}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <section className={styles.characterColumn} aria-label="Character showcase">
        {activeCharacter ? (
          <h2 className={styles.characterName}>{activeCharacter.name}</h2>
        ) : (
          <h2 className={styles.characterNameMuted}>No Character</h2>
        )}

        <div className={styles.characterPedestal}>
          {activeCharacter ? (
            <CharacterPreview character={activeCharacter} size="stage" />
          ) : (
            <div className={styles.noCharacter}>
              <p>Create a character to enter the arena</p>
              <GameButton onClick={() => setScreen('characters')}>
                Change Character
              </GameButton>
            </div>
          )}
        </div>
      </section>

      <aside className={styles.sidePanel}>
        <header className={styles.sideHeader}>
          <h1 className={styles.title}>Spellbound Arena</h1>
        </header>

        {showMatchmaking ? (
          <MatchmakingPanel
            disabled={!activeCharacter}
            onBack={() => setShowMatchmaking(false)}
            onSearch={handleSearch}
          />
        ) : (
          <>
            <nav className={styles.sideNav}>
              <GameButton
                variant="primary"
                fullWidth
                disabled={!activeCharacter}
                onClick={() => setShowMatchmaking(true)}
              >
                Find Match
              </GameButton>

              <GameButton fullWidth onClick={() => setScreen('characters')}>
                Change Character
              </GameButton>

              <GameButton
                fullWidth
                disabled={!activeCharacter}
                onClick={() => openCharacters('fitting')}
              >
                Fitting Room
              </GameButton>

              <GameButton fullWidth onClick={() => setScreen('skill_gallery')}>
                Skill Gallery
              </GameButton>

              <GameButton fullWidth onClick={() => setScreen('rating')}>
                Rating
              </GameButton>

              <GameButton variant="ghost" fullWidth onClick={logout}>
                Logout
              </GameButton>
            </nav>

            {!activeCharacter && (
              <p className={styles.hint}>
                Select or create a character before finding a match
              </p>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
