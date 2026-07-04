import {
  BOT_DIFFICULTIES,
  botDifficultyLabel,
  findPlayerSlot,
  getLobbyReadiness,
  getTeamSlots,
  matchModeLabel,
  arenaMapLabel,
  type Character,
  type BotDifficulty,
  type LobbySlot,
} from '@spellbound/shared';
import { useAuthStore } from '../../stores/authStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import { CharacterPreview } from '../../components/three/CharacterPreview';
import { ArenaMapPreview } from '../../components/three/ArenaMapPreview';
import { GameButton } from '../../components/ui/GameButton';
import { GamePanel } from '../../components/ui/GamePanel';
import { StatDisplay } from '../../components/ui/StatDisplay';
import styles from './LobbyScreen.module.scss';

const TEAM_NAMES = {
  teamA: 'Alpha Team',
  teamB: 'Beta Team',
} as const;

interface SlotCardProps {
  slot: LobbySlot;
  isOwnSlot: boolean;
  isHost: boolean;
  currentUserId: string;
  botDifficulty: BotDifficulty;
  onBotDifficultyChange: (difficulty: BotDifficulty) => void;
  onJoin: () => void;
  onLeave: () => void;
  onAddBot: () => void;
  onRemoveBot: () => void;
}

function SlotStats({ character }: { character: Character }) {
  return (
    <StatDisplay
      stats={character.stats}
      layout="row"
      iconSize={14}
      showLabels
      className={styles.slotStats}
    />
  );
}

function SlotCard({
  slot,
  isOwnSlot,
  isHost,
  currentUserId,
  botDifficulty,
  onBotDifficultyChange,
  onJoin,
  onLeave,
  onAddBot,
  onRemoveBot,
}: SlotCardProps) {
  const occupant = slot.occupant;
  const isEmpty = !occupant;
  const isOpponentSide = !isEmpty && occupant.id !== currentUserId && !isOwnSlot;

  if (isEmpty) {
    return (
      <div className={`${styles.slot} ${styles.slotEmpty}`}>
        <CharacterPreview empty size="slot" onClick={onJoin} />
        <span className={`${styles.slotName} ${styles.slotNameEmpty}`}>
          Waiting for player
        </span>
        <div className={styles.slotActions}>
          <GameButton size="small" onClick={onJoin}>
            Join
          </GameButton>
          <GameButton size="small" variant="ghost" onClick={onAddBot}>
            + Bot
          </GameButton>
        </div>
      </div>
    );
  }

  const slotClass = [styles.slot, styles.slotFilled, isOwnSlot ? styles.slotOwn : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={slotClass}>
      <div className={styles.slotFigure}>
        <CharacterPreview
          character={occupant.character}
          isBot={occupant.isBot}
          size="lobby"
          frameless
        />
      </div>

      <div className={styles.slotMeta}>
        <span className={styles.slotName}>
          {occupant.username}
          {occupant.isBot && <span className={styles.botTag}>BOT</span>}
        </span>

        {occupant.isBot && (
          <div className={styles.botDifficultyRow}>
            {isHost ? (
              <select
                className={styles.botDifficultySelect}
                value={botDifficulty}
                onChange={(e) =>
                  onBotDifficultyChange(e.target.value as BotDifficulty)
                }
                aria-label="Bot difficulty"
              >
                {BOT_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {botDifficultyLabel(d)}
                  </option>
                ))}
              </select>
            ) : (
              <span className={styles.botDifficultyLabel}>
                {botDifficultyLabel(botDifficulty)}
              </span>
            )}
          </div>
        )}

        <SlotStats character={occupant.character} />
      </div>

      <div className={styles.slotActions}>
        {isOwnSlot && (
          <GameButton size="small" variant="ghost" onClick={onLeave}>
            Leave
          </GameButton>
        )}
        {occupant.isBot && isHost && (
          <GameButton size="small" variant="ghost" onClick={onRemoveBot}>
            Remove
          </GameButton>
        )}
        {!isEmpty && isOpponentSide && occupant.isBot && !isHost && (
          <span className={styles.botLabel}>AI Opponent</span>
        )}
      </div>
    </div>
  );
}

export function LobbyScreen() {
  const user = useAuthStore((s) => s.user);
  const lobby = useGameStore((s) => s.lobby);
  const joinLobbySlot = useGameStore((s) => s.joinLobbySlot);
  const leaveLobbySlot = useGameStore((s) => s.leaveLobbySlot);
  const placeBot = useGameStore((s) => s.placeBot);
  const removeBot = useGameStore((s) => s.removeBot);
  const leaveLobby = useGameStore((s) => s.leaveLobby);
  const startBattle = useGameStore((s) => s.startBattle);
  const botDifficulty = useGameStore((s) => s.botDifficulty);
  const setBotDifficulty = useGameStore((s) => s.setBotDifficulty);
  const getActiveCharacter = useCharacterStore((s) => s.getActiveCharacter);

  if (!lobby || !user) return null;

  const activeCharacter = getActiveCharacter(user.id);
  const readiness = getLobbyReadiness(lobby);
  const playerSlot = findPlayerSlot(lobby, user.id);
  const isHost = lobby.hostId === user.id;
  const teamASlots = getTeamSlots(lobby, 'teamA');
  const teamBSlots = getTeamSlots(lobby, 'teamB');

  const handleJoin = (slotId: string) => {
    if (!activeCharacter) return;
    joinLobbySlot(slotId, user.id, activeCharacter);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <GamePanel width="auto" compact className={styles.infoPanel}>
          <div className={styles.info}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Mode</span>
              <span className={styles.infoValue}>{matchModeLabel(lobby.mode)}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Arena</span>
              <span className={styles.infoValue}>{arenaMapLabel(lobby.mapId)}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Ready</span>
              <span className={styles.infoValue}>
                {readiness.filled}/{readiness.total}
              </span>
            </div>
          </div>
        </GamePanel>
      </header>

      <div className={styles.arena}>
        <div className={styles.team}>
          <h3 className={styles.teamTitle}>{TEAM_NAMES.teamA}</h3>
          <div className={styles.slots}>
            {teamASlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isOwnSlot={slot.occupant?.id === user.id}
                isHost={isHost}
                currentUserId={user.id}
                botDifficulty={botDifficulty}
                onBotDifficultyChange={setBotDifficulty}
                onJoin={() => handleJoin(slot.id)}
                onLeave={() => leaveLobbySlot(slot.id, user.id)}
                onAddBot={() => placeBot(slot.id, user.id)}
                onRemoveBot={() => removeBot(slot.id, user.id)}
              />
            ))}
          </div>
        </div>

        <ArenaMapPreview mapId={lobby.mapId} className={styles.mapPreview} />

        <div className={`${styles.team} ${styles.teamB}`}>
          <h3 className={styles.teamTitle}>{TEAM_NAMES.teamB}</h3>
          <div className={styles.slots}>
            {teamBSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isOwnSlot={slot.occupant?.id === user.id}
                isHost={isHost}
                currentUserId={user.id}
                botDifficulty={botDifficulty}
                onBotDifficultyChange={setBotDifficulty}
                onJoin={() => handleJoin(slot.id)}
                onLeave={() => leaveLobbySlot(slot.id, user.id)}
                onAddBot={() => placeBot(slot.id, user.id)}
                onRemoveBot={() => removeBot(slot.id, user.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <GameButton variant="ghost" onClick={leaveLobby}>
            Back to Menu
          </GameButton>
        </div>

        <div className={styles.footerCenter}>
          <GameButton
            variant="primary"
            disabled={!readiness.canStart}
            onClick={() => user && startBattle(user.id)}
            title={
              !readiness.canStart
                ? 'Fill all slots to begin (add bots to empty enemy slots)'
                : 'Start the duel'
            }
          >
            {readiness.canStart ? 'Begin Duel' : `Waiting (${readiness.filled}/${readiness.total})`}
          </GameButton>
        </div>

        <div className={styles.footerRight}>
          {playerSlot && (
            <span className={styles.yourTeam}>
              Your team: {TEAM_NAMES[playerSlot.side]}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
