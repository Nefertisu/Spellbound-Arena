import { useEffect, useState } from 'react';
import { AuthModal } from './features/auth/AuthModal';
import { BattleScreen } from './features/battle/BattleScreen';
import { CharacterScreen } from './features/characters/CharacterScreen';
import { LobbyScreen } from './features/lobby/LobbyScreen';
import { MainMenu } from './features/menu/MainMenu';
import { SkillGallery } from './features/menu/SkillGallery';
import { RatingScreen } from './features/menu/RatingScreen';
import { useAuthStore } from './stores/authStore';
import { useCharacterStore } from './stores/characterStore';
import { useGameStore } from './stores/gameStore';
import { initRoomService, shutdownRoomService } from './services/room.service';
import styles from './App.module.scss';
import './styles/global.scss';

function ErrorToast() {
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(clearError, 4000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  if (!error) return null;

  return <div className={styles.errorToast}>{error}</div>;
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const [authReady, setAuthReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    initRoomService();

    return () => {
      shutdownRoomService();
    };
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !user) return;
    void loadCharacters(user.id);
  }, [authReady, user?.id, loadCharacters]);

  return (
    <div className={styles.root}>
      <AuthModal />

      {isAuthenticated && (
        <>
          {screen === 'battle' && <BattleScreen />}
          {screen !== 'battle' && (
            <div className={styles.screen}>
              {screen === 'menu' && <MainMenu />}
              {screen === 'skill_gallery' && (
                <SkillGallery onBack={() => setScreen('menu')} />
              )}
              {screen === 'rating' && <RatingScreen onBack={() => setScreen('menu')} />}
              {screen === 'lobby' && <LobbyScreen />}
              {screen === 'characters' && <CharacterScreen />}
            </div>
          )}
        </>
      )}

      <ErrorToast />
    </div>
  );
}

export default App;
