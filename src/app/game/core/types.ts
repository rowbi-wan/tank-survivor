export type WeaponBehavior = 'bullet' | 'laser' | 'wave' | 'spin';

export interface FireConfig {
  fireInterval: number;
  projectileCount: number;
  spreadAngle: number;
  projectileSpeed: number;
  projectileRadius: number;
  projectileDamage: number;
  pierce: number;
  behavior: WeaponBehavior;
  /** Laser beam length in world units */
  laserLength: number;
  /** Wave arc width in radians */
  waveArc: number;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  moveSpeed: number;
  damageMult: number;
  fireRateMult: number;
  pickupRadius: number;
  xp: number;
  level: number;
  xpToNext: number;
}

export type EnemyKind =
  'chaser' | 'swarm' | 'brute' | 'spitter' | 'exploder' | 'bossA' | 'bossB';

export interface EnemyDef {
  kind: EnemyKind;
  hp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xp: number;
  color: number;
  outline: number;
}

export type StatUpgradeId =
  'maxHp' | 'moveSpeed' | 'damage' | 'fireRate' | 'pickupRadius';

export interface StatUpgradeOption {
  id: StatUpgradeId;
  label: string;
  description: string;
}

export interface GameHudSnapshot {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  timeSec: number;
  kills: number;
  paused: boolean;
  dead: boolean;
  levelUpPending: boolean;
  levelUpOptions: StatUpgradeOption[];
}

export interface RunResult {
  timeSec: number;
  kills: number;
  level: number;
  currencyEarned: number;
  milestonesReached: string[];
}

export type GameEvent =
  | { type: 'hud'; snapshot: GameHudSnapshot }
  | { type: 'levelUp'; options: StatUpgradeOption[] }
  | { type: 'runEnd'; result: RunResult };
