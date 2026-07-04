import { useMemo, useState, useEffect, useRef, type ChangeEvent } from 'react';
import type { Character, GearKind, GearRarity, ShopGear } from '@spellbound/shared';
import {
  GEAR_KINDS,
  GEAR_RARITIES,
  STAT_KEYS,
  STAT_LABELS,
  buildFittingRoomCatalog,
  filterFittingRoomCatalog,
  formatGearStatSummary,
  gearKindLabel,
  gearRarityLabel,
  getGearStatLines,
  mergeCharacterStats,
  mergeGearStatBonuses,
  sortEquippedGear,
} from '@spellbound/shared';
import { CharacterPreview, type CharacterPreviewBody } from '../../components/three/CharacterPreview';
import { GameButton } from '../../components/ui/GameButton';
import { StatIcon } from '../../components/ui/StatIcon';
import { useCustomModelStore } from '../../stores/customModelStore';
import { CUSTOM_MODEL_ACCEPT } from '../../utils/customModelStorage';
import styles from './FittingRoom.module.scss';

const GEAR_ICON: Record<GearKind, string> = {
  helmet: '🪖',
  hood: '🧥',
  cloak: '🧣',
  belt: '⛓',
  gloves: '🧤',
  boots: '👢',
};

const RARITY_CLASS: Record<GearRarity, string> = {
  common: styles.rarityCommon,
  uncommon: styles.rarityUncommon,
  rare: styles.rarityRare,
  epic: styles.rarityEpic,
};

type RarityFilter = GearRarity | 'all';

interface FittingRoomProps {
  character: Character;
  onBack: () => void;
}

export function FittingRoom({ character, onBack }: FittingRoomProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalog = useMemo(() => buildFittingRoomCatalog(), []);
  const [selectedKind, setSelectedKind] = useState<GearKind>('helmet');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [tryOnByKind, setTryOnByKind] = useState<Partial<Record<GearKind, ShopGear>>>({});
  const [bodyMode, setBodyMode] = useState<CharacterPreviewBody>('mannequin');

  const customModelUrl = useCustomModelStore((s) => s.objectUrl);
  const customFileName = useCustomModelStore((s) => s.fileName);
  const customModelScale = useCustomModelStore((s) => s.scale);
  const customModelLoading = useCustomModelStore((s) => s.isLoading);
  const customModelError = useCustomModelStore((s) => s.error);
  const loadCustomModel = useCustomModelStore((s) => s.loadForUser);
  const uploadCustomModel = useCustomModelStore((s) => s.uploadFile);
  const clearCustomModel = useCustomModelStore((s) => s.clearModel);
  const setCustomModelScale = useCustomModelStore((s) => s.setScale);

  useEffect(() => {
    void loadCustomModel(character.ownerId);
  }, [character.ownerId, loadCustomModel]);

  useEffect(() => {
    if (customModelUrl) {
      setBodyMode('custom');
    }
  }, [customModelUrl]);

  const filteredItems = useMemo(
    () => filterFittingRoomCatalog(catalog, selectedKind, rarityFilter),
    [catalog, selectedKind, rarityFilter],
  );

  const equippedGear = useMemo(
    () => sortEquippedGear(Object.values(tryOnByKind).filter((item): item is ShopGear => item != null)),
    [tryOnByKind],
  );

  const gearBonus = useMemo(() => mergeGearStatBonuses(equippedGear), [equippedGear]);
  const totalStats = useMemo(
    () => mergeCharacterStats(character.stats, gearBonus),
    [character.stats, gearBonus],
  );

  const toggleGear = (item: ShopGear) => {
    setTryOnByKind((current) => {
      if (current[item.kind]?.id === item.id) {
        const next = { ...current };
        delete next[item.kind];
        return next;
      }
      return { ...current, [item.kind]: item };
    });
  };

  const clearSlot = () => {
    setTryOnByKind((current) => {
      if (!current[selectedKind]) return current;
      const next = { ...current };
      delete next[selectedKind];
      return next;
    });
  };

  const clearAll = () => setTryOnByKind({});

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await uploadCustomModel(character.ownerId, file);
    setBodyMode('custom');
  };

  const handleRemoveModel = async () => {
    await clearCustomModel(character.ownerId);
    setBodyMode('mannequin');
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Fitting Room</h2>
          <p className={styles.subtitle}>
            Preview gear on {character.name}. Nothing is saved — battle loadout is chosen in the shop.
          </p>
        </div>
        <GameButton variant="ghost" onClick={onBack}>
          Back to Roster
        </GameButton>
      </header>

      <div className={styles.layout}>
        <section className={styles.previewCol} aria-label="Character preview">
          <div className={styles.modelPanel}>
            <div className={styles.bodyTabs} role="tablist" aria-label="Body model">
              <button
                type="button"
                role="tab"
                aria-selected={bodyMode === 'mannequin'}
                className={`${styles.bodyTab} ${bodyMode === 'mannequin' ? styles.bodyTabActive : ''}`}
                onClick={() => setBodyMode('mannequin')}
              >
                Mannequin
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={bodyMode === 'custom'}
                className={`${styles.bodyTab} ${bodyMode === 'custom' ? styles.bodyTabActive : ''}`}
                onClick={() => setBodyMode('custom')}
                disabled={!customModelUrl}
              >
                Custom Model
              </button>
            </div>

            <div className={styles.modelActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept={CUSTOM_MODEL_ACCEPT}
                className={styles.hiddenFileInput}
                onChange={(event) => void handleFileChange(event)}
              />
              <GameButton size="small" onClick={handleUploadClick} disabled={customModelLoading}>
                {customModelLoading ? 'Loading...' : 'Upload Model'}
              </GameButton>
              {customModelUrl && (
                <GameButton size="small" variant="ghost" onClick={() => void handleRemoveModel()}>
                  Remove
                </GameButton>
              )}
            </div>

            {customFileName && (
              <p className={styles.modelFileName}>{customFileName}</p>
            )}

            {customModelError && <p className={styles.modelError}>{customModelError}</p>}

            {bodyMode === 'custom' && customModelUrl && (
              <label className={styles.scaleControl}>
                <span>Model scale</span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={customModelScale}
                  onChange={(event) => setCustomModelScale(Number(event.target.value))}
                />
                <span>{customModelScale.toFixed(2)}×</span>
              </label>
            )}

            <p className={styles.modelHint}>GLB / GLTF up to 15 MB. Gear is overlaid using mannequin anchors.</p>
          </div>

          <div className={styles.previewStage}>
            <CharacterPreview
              character={character}
              size="full"
              frameless
              equippedGear={equippedGear}
              bodyMode={bodyMode}
              customModelUrl={customModelUrl}
              customModelScale={customModelScale}
            />
          </div>

          <div className={styles.statsPanel}>
            <p className={styles.statsTitle}>Stats with try-on gear</p>
            <div className={styles.statsRow}>
              {STAT_KEYS.map((key) => {
                const base = character.stats[key];
                const bonus = gearBonus[key];
                const total = totalStats[key];
                if (bonus <= 0) {
                  return (
                    <span key={key} className={styles.statChip} title={STAT_LABELS[key]}>
                      <StatIcon stat={key} size={16} />
                      <span className={styles.statTotal}>{total}</span>
                    </span>
                  );
                }
                return (
                  <span key={key} className={styles.statChip} title={STAT_LABELS[key]}>
                    <StatIcon stat={key} size={16} />
                    <span>{base}</span>
                    <span className={styles.statBonus}>+{bonus}</span>
                    <span>=</span>
                    <span className={styles.statTotal}>{total}</span>
                  </span>
                );
              })}
            </div>

            {equippedGear.length > 0 ? (
              <div className={styles.equippedList}>
                {equippedGear.map((gear) => (
                  <span key={gear.id} className={styles.equippedTag}>
                    {gearKindLabel(gear.kind)}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.hint}>No gear selected yet.</p>
            )}
          </div>
        </section>

        <section className={styles.gearCol} aria-label="Gear catalog">
          <div className={styles.slotTabs} role="tablist" aria-label="Gear slots">
            {GEAR_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={selectedKind === kind}
                className={`${styles.slotTab} ${selectedKind === kind ? styles.slotTabActive : ''}`}
                onClick={() => setSelectedKind(kind)}
              >
                {gearKindLabel(kind)}
              </button>
            ))}
          </div>

          <div className={styles.rarityFilters} role="group" aria-label="Rarity filter">
            <button
              type="button"
              className={`${styles.rarityChip} ${rarityFilter === 'all' ? styles.rarityChipActive : ''}`}
              onClick={() => setRarityFilter('all')}
            >
              All
            </button>
            {GEAR_RARITIES.map((rarity) => (
              <button
                key={rarity}
                type="button"
                className={`${styles.rarityChip} ${RARITY_CLASS[rarity]} ${rarityFilter === rarity ? styles.rarityChipActive : ''}`}
                onClick={() => setRarityFilter(rarity)}
              >
                {gearRarityLabel(rarity)}
              </button>
            ))}
          </div>

          <div className={styles.gearList}>
            {filteredItems.map((item) => {
              const selected = tryOnByKind[item.kind]?.id === item.id;
              const statLines = getGearStatLines(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.gearItem} ${selected ? styles.gearItemSelected : ''}`}
                  onClick={() => toggleGear(item)}
                >
                  <div className={`${styles.gearIcon} ${RARITY_CLASS[item.rarity]}`}>
                    <span>{GEAR_ICON[item.kind]}</span>
                  </div>
                  <div className={styles.gearInfo}>
                    <span className={`${styles.gearName} ${RARITY_CLASS[item.rarity]}`}>{item.name}</span>
                    <span className={styles.gearMeta}>
                      {gearRarityLabel(item.rarity)} · {gearKindLabel(item.kind)}
                    </span>
                    <span className={styles.gearStats}>{formatGearStatSummary(item)}</span>
                    {statLines.length > 2 && (
                      <span className={styles.gearStats}>
                        {statLines.map((line) => `${STAT_LABELS[line.key]} +${line.value}`).join(' · ')}
                      </span>
                    )}
                  </div>
                  {selected ? <span className={styles.equippedBadge}>On</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p className={styles.hint}>Click an item to try it on. Click again to remove it from that slot.</p>
        <div>
          <GameButton size="small" variant="ghost" onClick={clearSlot} disabled={!tryOnByKind[selectedKind]}>
            Clear {gearKindLabel(selectedKind)}
          </GameButton>
          <GameButton size="small" variant="ghost" onClick={clearAll} disabled={equippedGear.length === 0}>
            Clear All
          </GameButton>
        </div>
      </footer>
    </div>
  );
}
