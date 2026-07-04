import type { CharacterStats, GearRarity, ShopGear, ShopSkill, SkillKind } from '@spellbound/shared';
import {
  canAffordGear,
  formatGearStatSummary,
  gearKindLabel,
  gearRarityLabel,
  getAllocatedPoints,
  getGearStatLines,
  getGearStatPoints,
  getRemainingAllocatablePoints,
  ROUND_BONUS_STAT_POINTS,
  SKILL_SLOT_COUNT,
  STAT_DESCRIPTIONS,
  STAT_LABELS,
} from '@spellbound/shared';
import { GameButton } from '../../components/ui/GameButton';
import { GamePanel } from '../../components/ui/GamePanel';
import { StatAllocator } from '../characters/StatAllocator';
import styles from './ShopPanel.module.scss';

const KIND_LABEL: Record<SkillKind, string> = {
  fireball: 'Fireball',
  impulse: 'Impulse',
  blink: 'Blink',
};

const SKILL_KIND_ICON: Record<SkillKind, string> = {
  fireball: '🔥',
  impulse: '💨',
  blink: '⚡',
};

const SKILL_KIND_COLOR: Record<SkillKind, string> = {
  fireball: '#cc3333',
  impulse: '#6080ff',
  blink: '#c9a227',
};

const GEAR_ICON: Record<ShopGear['kind'], string> = {
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

function SkillIcon({ skill }: { skill: ShopSkill }) {
  const color = SKILL_KIND_COLOR[skill.kind];
  return (
    <div className={styles.skillIcon} style={{ background: `linear-gradient(135deg, ${color}88, ${color}44)` }}>
      <span>{SKILL_KIND_ICON[skill.kind]}</span>
    </div>
  );
}

function GearIcon({ gear }: { gear: ShopGear }) {
  return (
    <div className={`${styles.skillIcon} ${styles.gearIcon} ${RARITY_CLASS[gear.rarity]}`}>
      <span>{GEAR_ICON[gear.kind]}</span>
    </div>
  );
}

function GearOfferCard({
  gear,
  equipped,
  canBuy,
  onBuy,
}: {
  gear: ShopGear;
  equipped: boolean;
  canBuy: boolean;
  onBuy: () => void;
}) {
  const statLines = getGearStatLines(gear);
  const totalStats = getGearStatPoints(gear);

  return (
    <button
      type="button"
      className={`${styles.offer} ${styles.gearOffer} ${equipped ? styles.owned : ''}`}
      disabled={!canBuy}
      onClick={onBuy}
    >
      <GearIcon gear={gear} />
      <span className={styles.name}>{gear.name}</span>
      <span className={`${styles.rarity} ${RARITY_CLASS[gear.rarity]}`}>
        {gearRarityLabel(gear.rarity)}
      </span>
      <span className={styles.gearStats}>{formatGearStatSummary(gear)}</span>
      <span className={styles.kind}>{gearKindLabel(gear.kind)}</span>
      <span className={styles.price}>
        {equipped ? 'Equipped' : `${gear.price}g`}
      </span>

      <div className={styles.gearTooltip} role="tooltip">
        <p className={`${styles.tooltipTitle} ${RARITY_CLASS[gear.rarity]}`}>
          {gear.name}
        </p>
        <p className={styles.tooltipMeta}>
          {gearRarityLabel(gear.rarity)} · {gearKindLabel(gear.kind)} · {totalStats} stats
        </p>
        <ul className={styles.tooltipStats}>
          {statLines.map((line) => (
            <li key={line.key}>
              <span className={styles.tooltipStatName}>
                {STAT_LABELS[line.key]} +{line.value}
              </span>
              <span className={styles.tooltipStatDesc}>{STAT_DESCRIPTIONS[line.key]}</span>
            </li>
          ))}
        </ul>
        <p className={styles.tooltipPrice}>
          {equipped ? 'Already equipped' : `Price: ${gear.price} gold`}
        </p>
      </div>
    </button>
  );
}

interface ShopPanelProps {
  round: number;
  gold: number;
  offers: ShopSkill[];
  gearOffers: ShopGear[];
  ownedSkills: ShopSkill[];
  ownedGear: ShopGear[];
  isReady: boolean;
  baseStats: CharacterStats;
  bonusStats: CharacterStats;
  roundStatDraft: CharacterStats;
  onBuy: (skillId: string) => void;
  onBuyGear: (gearId: string) => void;
  onStatDraftChange: (stats: CharacterStats) => void;
  onReady: () => void;
}

export function ShopPanel({
  round,
  gold,
  offers,
  gearOffers,
  ownedSkills,
  ownedGear,
  isReady,
  baseStats,
  bonusStats,
  roundStatDraft,
  onBuy,
  onBuyGear,
  onStatDraftChange,
  onReady,
}: ShopPanelProps) {
  const showStatRoll = round > 1;
  const statRemaining = showStatRoll
    ? getRemainingAllocatablePoints(roundStatDraft, ROUND_BONUS_STAT_POINTS)
    : 0;
  const statsReady = !showStatRoll || statRemaining === 0;
  const totalBonusAllocated = getAllocatedPoints(bonusStats);

  return (
    <div className={styles.overlay}>
      <GamePanel
        title={`Round ${round} Shop`}
        subtitle={`Gold: ${gold}`}
        className={`${styles.panel} ${styles.panelWide}`}
      >
        <div className={styles.layout}>
          {showStatRoll && (
            <section className={styles.statSection}>
              <p className={styles.statIntro}>
                Allocate <strong>{ROUND_BONUS_STAT_POINTS}</strong> bonus points.
                Stats show as <span className={styles.baseHint}>base</span>
                {' + '}
                <span className={styles.bonusHint}>round bonus</span>.
              </p>

              <div className={styles.statSummary}>
                <span>Base: {getAllocatedPoints(baseStats)} pts</span>
                <span>Earned bonus: {totalBonusAllocated}</span>
                <span>Draft: {getAllocatedPoints(roundStatDraft)}</span>
              </div>

              <StatAllocator
                stats={roundStatDraft}
                onChange={onStatDraftChange}
                pointBudget={ROUND_BONUS_STAT_POINTS}
                baseStats={baseStats}
                committedBonusStats={bonusStats}
                compact
                title="Round Bonus Stats"
              />
            </section>
          )}

          <section className={styles.shopSection}>
            <h3 className={styles.sectionTitle}>Skills</h3>
            <div className={styles.grid}>
              {offers.map((skill) => {
                const ownedCount = ownedSkills.filter((owned) => owned.kind === skill.kind).length;
                const slotsFull = ownedSkills.length >= SKILL_SLOT_COUNT;
                const canBuy = !slotsFull && gold >= skill.price;

                return (
                  <button
                    key={skill.id}
                    type="button"
                    className={`${styles.offer} ${ownedCount > 0 ? styles.owned : ''}`}
                    disabled={!canBuy}
                    onClick={() => onBuy(skill.id)}
                  >
                    <SkillIcon skill={skill} />
                    <span className={styles.name}>{skill.name}</span>
                    <span className={styles.kind}>{KIND_LABEL[skill.kind]}</span>
                    <span className={styles.price}>
                      {ownedCount > 0 ? `Owned x${ownedCount}` : `${skill.price}g`}
                    </span>
                  </button>
                );
              })}
            </div>

            <h3 className={styles.sectionTitle}>Gear</h3>
            <div className={`${styles.grid} ${styles.gearGrid}`}>
              {gearOffers.map((gear) => {
                const ownedOfKind = ownedGear.find((owned) => owned.kind === gear.kind);
                const isEquipped = ownedOfKind?.id === gear.id;
                const canBuy = !isEquipped && canAffordGear(gold, ownedGear, gear);

                return (
                  <GearOfferCard
                    key={gear.id}
                    gear={gear}
                    equipped={isEquipped}
                    canBuy={canBuy}
                    onBuy={() => onBuyGear(gear.id)}
                  />
                );
              })}
            </div>
          </section>
        </div>

        <div className={styles.actions}>
          <GameButton
            variant="primary"
            disabled={isReady || !statsReady}
            onClick={onReady}
          >
            {isReady ? 'Waiting...' : statsReady ? 'Ready' : `Allocate stats (${statRemaining} left)`}
          </GameButton>
        </div>

        <p className={styles.hint}>
          Gear grants stat bonuses. Hover an item for full details.
        </p>
      </GamePanel>
    </div>
  );
}
