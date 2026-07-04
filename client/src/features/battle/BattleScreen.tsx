import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useBattleStore } from '../../stores/battleStore';
import { useGameStore } from '../../stores/gameStore';
import { GameButton } from '../../components/ui/GameButton';
import { BattleArena } from './BattleArena';
import { BattleHUD, MatchEndOverlay } from './BattleHUD';
import { BattlePauseMenu } from './BattlePauseMenu';
import { RoundCountdown } from './RoundCountdown';
import { ShopPanel } from './ShopPanel';
import { useBattleInput } from './useBattleInput';
import { useBattlePauseMenu } from './useBattlePauseMenu';
import { useBattlePointerLock } from './useBattlePointerLock';
import { useMatchLeaveGuard } from './useMatchLeaveGuard';
import styles from './BattleScreen.module.scss';

export function BattleScreen() {
  const user = useAuthStore((s) => s.user);
  const lobby = useGameStore((s) => s.lobby);
  const botDifficulty = useGameStore((s) => s.botDifficulty);
  const leaveLobby = useGameStore((s) => s.leaveLobby);
  const battle = useBattleStore((s) => s.battle);
  const initBattle = useBattleStore((s) => s.initBattle);
  const buySkill = useBattleStore((s) => s.buySkill);
  const buyGear = useBattleStore((s) => s.buyGear);
  const setRoundStatDraft = useBattleStore((s) => s.setRoundStatDraft);
  const setReady = useBattleStore((s) => s.setReady);
  const clearBattle = useBattleStore((s) => s.clearBattle);
  const { confirmLeave } = useMatchLeaveGuard();
  const [pauseOpen, setPauseOpen] = useState(false);

  const isCombat = battle?.phase === 'combat';
  const canPause = Boolean(battle && battle.phase !== 'match_end');
  const inputEnabled = !pauseOpen;

  const openPause = useCallback(() => setPauseOpen(true), []);
  const closePause = useCallback(() => setPauseOpen(false), []);

  useBattlePauseMenu(canPause, pauseOpen, openPause, closePause);
  useBattleInput(user?.id, inputEnabled);
  useBattlePointerLock(!!isCombat && !pauseOpen);

  useEffect(() => {
    if (!canPause) {
      setPauseOpen(false);
    }
  }, [canPause]);

  useEffect(() => {
    if (!useBattleStore.getState().battle && lobby && user) {
      initBattle({ ...lobby, status: 'in_progress' }, user.id, botDifficulty);
    }
  }, [lobby, user, botDifficulty, initBattle]);

  const handleExit = () => {
    if (!confirmLeave()) return;
    setPauseOpen(false);
    clearBattle();
    leaveLobby();
  };

  if (!user) return null;

  if (!battle) {
    return (
      <div className={styles.screen}>
        <div className={styles.fallback}>
          <p>Loading arena...</p>
          <GameButton variant="ghost" onClick={handleExit}>
            Back to Menu
          </GameButton>
        </div>
      </div>
    );
  }

  const localMeta = battle.players.find((p) => p.playerId === user.id);
  const screenClass = `${styles.screen} ${isCombat && !pauseOpen ? styles.combat : ''}`;

  return (
    <div className={screenClass}>
      <BattleArena paused={pauseOpen} />
      <BattleHUD />

      {battle.phase === 'round_end' && <RoundCountdown />}

      {battle.phase === 'shop' && localMeta && !pauseOpen && (
        <ShopPanel
          round={battle.round}
          gold={localMeta.gold}
          offers={battle.shopOffers}
          gearOffers={battle.gearOffers}
          ownedSkills={localMeta.equippedSkills}
          ownedGear={localMeta.equippedGear}
          isReady={localMeta.isReady}
          baseStats={localMeta.baseStats}
          bonusStats={localMeta.bonusStats}
          roundStatDraft={localMeta.roundStatDraft}
          onBuy={(id) => buySkill(user.id, id)}
          onBuyGear={(id) => buyGear(user.id, id)}
          onStatDraftChange={(stats) => setRoundStatDraft(user.id, stats)}
          onReady={() => setReady(user.id)}
        />
      )}

      {pauseOpen && (
        <BattlePauseMenu onResume={closePause} onLeave={handleExit} />
      )}

      {battle.phase === 'match_end' && (
        <MatchEndOverlay
          message={battle.lastRoundMessage ?? 'Match complete'}
          onExit={handleExit}
        />
      )}
    </div>
  );
}
