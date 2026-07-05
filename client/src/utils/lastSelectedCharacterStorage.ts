const STORAGE_KEY = 'spellbound-last-selected-character';

type StoredSelections = Record<string, string>;

function readAll(): StoredSelections {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as StoredSelections;
  } catch {
    return {};
  }
}

function writeAll(selections: StoredSelections): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
}

function migrateFromLegacyStore(userId: string): string | null {
  try {
    const raw = localStorage.getItem('spellbound-characters');
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const state = parsed as {
      state?: {
        lastSelectedByUser?: Record<string, string>;
        lastPlayedByUser?: Record<string, string>;
      };
    };

    return (
      state.state?.lastSelectedByUser?.[userId] ??
      state.state?.lastPlayedByUser?.[userId] ??
      null
    );
  } catch {
    return null;
  }
}

export function getLastSelectedCharacterId(userId: string): string | null {
  const current = readAll()[userId];
  if (current) return current;

  const legacy = migrateFromLegacyStore(userId);
  if (legacy) {
    setLastSelectedCharacterId(userId, legacy);
  }

  return legacy;
}

export function setLastSelectedCharacterId(userId: string, characterId: string): void {
  const selections = readAll();
  selections[userId] = characterId;
  writeAll(selections);
}

export function clearLastSelectedCharacterId(userId: string): void {
  const selections = readAll();
  delete selections[userId];
  writeAll(selections);
}
