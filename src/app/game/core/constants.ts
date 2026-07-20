export const ARENA_RADIUS = 2200;
export const FIXED_DT = 1 / 60;
export const MAX_ENEMIES = 180;
export const MAX_PROJECTILES = 400;
export const MAX_XP_GEMS = 250;

export const BOSS_A_TIME = 5 * 60;
export const BOSS_B_TIME = 10 * 60;

export const COLORS = {
  skyTop: 0xb8e4ff,
  skyBottom: 0xe8f7ff,
  grass: 0x9fd98a,
  grassDark: 0x7fc46a,
  tankHull: 0xff8fab,
  tankHullOutline: 0xd45d7a,
  tankTurret: 0xffc2d4,
  tankTurretOutline: 0xd45d7a,
  bullet: 0xfff1a8,
  bulletOutline: 0xe6c85c,
  laser: 0x7fe9ff,
  wave: 0xc5a3ff,
  xp: 0x7dffb3,
  xpOutline: 0x3dbf7a,
  uiInk: 0x3a2f45,
} as const;

export const STAT_POOL: Array<{
  id: 'maxHp' | 'moveSpeed' | 'damage' | 'fireRate' | 'pickupRadius';
  label: string;
  description: string;
}> = [
  { id: 'maxHp', label: 'Bubble Armor', description: '+20 max HP and heal 20' },
  { id: 'moveSpeed', label: 'Turbo Treads', description: '+12% move speed' },
  { id: 'damage', label: 'Pop Power', description: '+15% damage' },
  { id: 'fireRate', label: 'Quick Trigger', description: '+12% fire rate' },
  {
    id: 'pickupRadius',
    label: 'Magnet Gum',
    description: '+25% XP pickup radius',
  },
];
