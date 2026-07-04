import type { ShopGear } from '@spellbound/shared';
import { GearModel } from './GearModel';

interface GearOverlayProps {
  equippedGear: ShopGear[];
  nightBoost?: number;
}

export function GearOverlay({ equippedGear, nightBoost = 0 }: GearOverlayProps) {
  const hasHelmet = equippedGear.some((gear) => gear.kind === 'helmet');

  return (
    <>
      {equippedGear.map((gear) => (
        <GearModel
          key={gear.id}
          kind={gear.kind}
          variant={gear.visualVariant}
          rarity={gear.rarity}
          nightBoost={nightBoost}
          hoodUnderHelmet={gear.kind === 'hood' && hasHelmet}
        />
      ))}
    </>
  );
}
