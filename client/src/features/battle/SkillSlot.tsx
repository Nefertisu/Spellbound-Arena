import type { ShopSkill } from '@spellbound/shared';

import { SKILL_COOLDOWNS, SKILL_MANA_COSTS } from '@spellbound/shared';

import styles from './SkillSlot.module.scss';



const SKILL_ICONS: Record<ShopSkill['kind'], string> = {

  fireball: '🔥',

  impulse: '💨',

  blink: '⚡',

};



interface SkillSlotProps {

  skill?: ShopSkill | null;

  index: number;

  cooldownRemaining?: number;

  currentMana?: number;

}



const VIEW_SIZE = 64;

const CENTER = VIEW_SIZE / 2;

const WEDGE_RADIUS = 30;



function getSlotKeyLabel(index: number): string {

  if (index < 9) return String(index + 1);

  if (index === 9) return '0';

  if (index === 10) return '-';

  return '=';

}



function describeCooldownWedge(remainingFraction: number): string {

  const cx = CENTER;

  const cy = CENTER;

  const r = WEDGE_RADIUS;



  if (remainingFraction <= 0) return '';

  if (remainingFraction >= 0.999) {

    return [

      `M ${cx} ${cy}`,

      `m 0 ${-r}`,

      `a ${r} ${r} 0 1 1 0 ${r * 2}`,

      `a ${r} ${r} 0 1 1 0 ${-r * 2}`,

      'Z',

    ].join(' ');

  }



  const startAngle = -Math.PI / 2;

  const sweep = remainingFraction * Math.PI * 2;

  const endAngle = startAngle + sweep;



  const x1 = cx + r * Math.cos(startAngle);

  const y1 = cy + r * Math.sin(startAngle);

  const x2 = cx + r * Math.cos(endAngle);

  const y2 = cy + r * Math.sin(endAngle);

  const largeArc = sweep > Math.PI ? 1 : 0;



  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

}



function describeCooldownLeadingEdge(remainingFraction: number): string | null {

  if (remainingFraction <= 0 || remainingFraction >= 0.999) return null;



  const cx = CENTER;

  const cy = CENTER;

  const r = WEDGE_RADIUS;

  const startAngle = -Math.PI / 2;

  const endAngle = startAngle + remainingFraction * Math.PI * 2;

  const x = cx + r * Math.cos(endAngle);

  const y = cy + r * Math.sin(endAngle);



  return `M ${cx} ${cy} L ${x} ${y}`;

}



function formatCooldown(seconds: number): string {

  if (seconds >= 10) return String(Math.ceil(seconds));

  if (seconds >= 1) return seconds.toFixed(1).replace(/\.0$/, '');

  return seconds.toFixed(1);

}



export function SkillSlot({

  skill,

  index,

  cooldownRemaining = 0,

  currentMana = 0,

}: SkillSlotProps) {

  const keyLabel = getSlotKeyLabel(index);



  if (!skill) {

    return (

      <div className={styles.slotWrap}>

        <div className={`${styles.slotBody} ${styles.slotEmpty}`}>

          <span className={styles.emptyMark}>{keyLabel}</span>

        </div>

        <span className={styles.keyBadge}>{keyLabel}</span>

      </div>

    );

  }



  const maxCooldown = SKILL_COOLDOWNS[skill.kind];

  const manaCost = SKILL_MANA_COSTS[skill.kind];

  const onCooldown = cooldownRemaining > 0;

  const noMana = !onCooldown && currentMana < manaCost;

  const cooldownFraction = onCooldown ? cooldownRemaining / maxCooldown : 0;

  const wedgePath = describeCooldownWedge(cooldownFraction);

  const leadingEdge = describeCooldownLeadingEdge(cooldownFraction);



  const slotClass = [

    styles.slotBody,

    onCooldown ? styles.slotOnCooldown : '',

    noMana ? styles.slotNoMana : '',

  ]

    .filter(Boolean)

    .join(' ');



  return (

    <div className={styles.slotWrap} title={skill.name}>

      <div className={slotClass}>

      <div className={styles.iconWrap}>

        <span className={styles.icon}>{SKILL_ICONS[skill.kind]}</span>

      </div>



      <span

        className={`${styles.manaCost} ${noMana ? styles.manaCostBlocked : ''}`}

      >

        {manaCost}

      </span>



      {onCooldown && (

        <svg

          className={styles.cooldownSvg}

          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}

          aria-hidden

        >

          <defs>

            <radialGradient id={`cd-shade-${index}`} cx="50%" cy="50%" r="50%">

              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.72)" />

              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.88)" />

            </radialGradient>

          </defs>

          <path d={wedgePath} className={styles.cooldownWedge} fill={`url(#cd-shade-${index})`} />

          {leadingEdge && (

            <path d={leadingEdge} className={styles.cooldownLeadingEdge} />

          )}

        </svg>

      )}



      {onCooldown && (

        <span className={styles.cooldownText}>

          {formatCooldown(cooldownRemaining)}

        </span>

      )}



      {noMana && <div className={styles.manaVeil} aria-hidden />}

      </div>



      <span className={styles.keyBadge}>{keyLabel}</span>

    </div>

  );

}

