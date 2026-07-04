import {
  computeHpRegenPerSec,
  computeManaRegenPerSec,
  formatBattleTime,
  getSkillCooldownRemaining,
  SKILL_SLOT_COUNT,
} from '@spellbound/shared';
import { useBattleStore } from '../../stores/battleStore';
import { GameButton } from '../../components/ui/GameButton';
import { Crosshair } from './Crosshair';
import { DayNightIndicator } from './DayNightIndicator';
import { ResourceGlobe } from './ResourceGlobe';
import { SkillSlot } from './SkillSlot';
import styles from './BattleHUD.module.scss';

function formatRegen(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function BattleHUD() {
  const battle = useBattleStore((s) => s.battle);
  if (!battle) return null;

  const localMeta = battle.players.find((p) => p.playerId === battle.localPlayerId);
  const localEntity = battle.entities.find(
    (e) => e.playerId === battle.localPlayerId,
  );
  const isCombat = battle.phase === 'combat';
  const showTopPanel = isCombat || battle.phase === 'shop';
  const battleClock = formatBattleTime(battle.dayTime);
  const hpRegen = localEntity
    ? computeHpRegenPerSec(localEntity.characterStats)
    : 0;
  const manaRegen = localEntity
    ? computeManaRegenPerSec(localEntity.characterStats)
    : 0;

  return (
    <div className={styles.hud}>
      {showTopPanel && (
        <div className={styles.topPanel}>
          <DayNightIndicator dayTime={battle.dayTime} compact />
          <div className={styles.matchInfo}>
            <span className={styles.clock}>{battleClock}</span>
            <span className={styles.divider}>·</span>
            <span className={styles.round}>Round {battle.round}</span>
            {isCombat && (
              <>
                <span className={styles.divider}>·</span>
                <span className={styles.arena}>{Math.round(battle.arenaRadius)}m</span>
              </>
            )}
            <span className={styles.divider}>·</span>
            <span className={styles.score}>
              {battle.roundWins.teamA}—{battle.roundWins.teamB}
              <span className={styles.winsTarget}> (FT{battle.winsToWin})</span>
            </span>
          </div>
        </div>
      )}

      {isCombat && <Crosshair />}

      {localEntity && isCombat && (
        <div className={styles.actionBar}>
          <div className={styles.actionBarGlobe}>
            <ResourceGlobe
              variant="hp"
              current={localEntity.hp}
              max={localEntity.maxHp}
              label="Life"
              corner={{ text: `+${formatRegen(hpRegen)}`, mode: 'regen' }}
              embedded
            />
          </div>

          <div className={styles.skillStrip}>
            {Array.from({ length: SKILL_SLOT_COUNT }, (_, index) => {
              const skill = localMeta?.equippedSkills[index] ?? null;
              return (
                <SkillSlot
                  key={skill?.id ?? `skill-slot-${index}`}
                  skill={skill}
                  index={index}
                  cooldownRemaining={
                    skill
                      ? getSkillCooldownRemaining(
                          battle,
                          battle.localPlayerId,
                          skill.id,
                        )
                      : 0
                  }
                  currentMana={localEntity.mana ?? 0}
                />
              );
            })}
          </div>

          <div className={styles.actionBarGlobe}>
            <ResourceGlobe
              variant="mana"
              current={localEntity.mana ?? 0}
              max={localEntity.maxMana ?? 100}
              label="Mana"
              corner={{ text: `+${formatRegen(manaRegen)}`, mode: 'regen' }}
              embedded
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MatchEndOverlayProps {
  message: string;
  onExit: () => void;
}

export function MatchEndOverlay({ message, onExit }: MatchEndOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayPanel}>
        <h2>Match Over</h2>
        <p>{message}</p>
        <div className={styles.overlayActions}>
          <GameButton variant="primary" onClick={onExit}>
            Back to Menu
          </GameButton>
        </div>
      </div>
    </div>
  );
}
