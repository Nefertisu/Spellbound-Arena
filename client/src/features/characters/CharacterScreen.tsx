import {
  canCreateCharacter,
  MAX_CHARACTERS_PER_USER,
  type Character,
} from "@spellbound/shared";
import { useAuthStore } from "../../stores/authStore";
import {
  useCharacterStore,
  useActiveCharacter,
  useUserCharacters,
} from "../../stores/characterStore";
import { useGameStore } from "../../stores/gameStore";
import { CharacterPreview } from "../../components/three/CharacterPreview";
import { GameButton } from "../../components/ui/GameButton";
import { StatDisplay } from "../../components/ui/StatDisplay";
import { CharacterCreator } from "./CharacterCreator";
import { FittingRoom } from "./FittingRoom";
import styles from "./CharacterScreen.module.scss";
import { useState, useEffect } from "react";
import type { CharacterView } from "../../types/app";

function CharacterListItem({
  character,
  isActive,
  onSelect,
}: {
  character: Character;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`${styles.listItem} ${isActive ? styles.listItemActive : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <div className={styles.listItemHeader}>
        <span className={styles.listItemName}>{character.name}</span>
        {isActive && <span className={styles.activeBadge}>Selected</span>}
      </div>
      <StatDisplay stats={character.stats} layout="compact" iconSize={14} />
    </div>
  );
}

export function CharacterScreen() {
  const user = useAuthStore((s) => s.user);
  const setScreen = useGameStore((s) => s.setScreen);
  const characterEntryView = useGameStore((s) => s.characterEntryView);
  const clearCharacterEntryView = useGameStore(
    (s) => s.clearCharacterEntryView,
  );
  const userId = user?.id;
  const userCharacters = useUserCharacters(userId);
  const selectedCharacter = useActiveCharacter(userId);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const createCharacter = useCharacterStore((s) => s.createCharacter);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const status = useCharacterStore((s) => s.status);
  const loadError = useCharacterStore((s) => s.error);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const cachedCharacterCount = useCharacterStore((s) => s.characters.length);

  const [view, setView] = useState<CharacterView>("roster");

  useEffect(() => {
    if (characterEntryView === "roster") return;
    setView(characterEntryView);
    clearCharacterEntryView();
  }, [characterEntryView, clearCharacterEntryView]);

  if (!user) return null;

  if (status === "loading" && view === "roster" && cachedCharacterCount === 0) {
    return (
      <div className={styles.screen}>
        <p className={styles.emptyState}>Loading characters...</p>
      </div>
    );
  }

  if (status === "error" && view === "roster") {
    return (
      <div className={styles.screen}>
        <p className={styles.emptyState}>
          {loadError ?? "Failed to load characters."}
        </p>
        <footer className={styles.footer}>
          <GameButton variant="ghost" onClick={() => setScreen("menu")}>
            Back to Menu
          </GameButton>
          <GameButton
            onClick={() => void loadCharacters(user.id, { force: true })}
          >
            Retry
          </GameButton>
        </footer>
      </div>
    );
  }

  const canCreate = canCreateCharacter(userCharacters.length);

  if (view === "fitting" && selectedCharacter) {
    return (
      <div className={styles.screen}>
        <FittingRoom
          character={selectedCharacter}
          onBack={() => setView("roster")}
        />
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className={styles.screen}>
        <CharacterCreator
          existingCount={userCharacters.length}
          onCreate={async (name, stats) => {
            const result = await createCharacter(user.id, name, stats);
            if (!result.success)
              return { success: false, message: result.message };
            return { success: true };
          }}
          onCreated={() => setView("roster")}
          onCancel={() => setView("roster")}
        />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.title}>Characters</h2>
        <span className={styles.count}>
          {userCharacters.length}/{MAX_CHARACTERS_PER_USER}
        </span>
      </header>

      <div className={styles.rosterLayout}>
        <aside className={styles.listCol}>
          {userCharacters.length === 0 ? (
            <p className={styles.emptyState}>
              No characters yet. Forge your first champion.
            </p>
          ) : (
            userCharacters.map((char) => (
              <CharacterListItem
                key={char.id}
                character={char}
                isActive={char.id === activeCharacterId}
                onSelect={() => selectCharacter(user.id, char.id)}
              />
            ))
          )}
        </aside>

        <main className={styles.previewCol}>
          {selectedCharacter ? (
            <>
              <h3 className={styles.previewName}>{selectedCharacter.name}</h3>
              <div className={styles.previewStage}>
                <CharacterPreview character={selectedCharacter} size="full" />
              </div>
              <StatDisplay
                stats={selectedCharacter.stats}
                layout="row"
                showLabels
                iconSize={22}
                className={styles.previewStats}
              />
            </>
          ) : (
            <div className={styles.noSelection}>
              <p>Create a character to see preview</p>
            </div>
          )}
        </main>
      </div>

      <footer className={styles.footer}>
        <GameButton variant="ghost" onClick={() => setScreen("menu")}>
          Back to Menu
        </GameButton>
        {selectedCharacter && (
          <GameButton onClick={() => setView("fitting")}>
            Fitting Room
          </GameButton>
        )}
        {canCreate && (
          <GameButton variant="primary" onClick={() => setView("create")}>
            Create Character
          </GameButton>
        )}
      </footer>
    </div>
  );
}
