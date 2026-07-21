import type { MapId } from '../../meta/maps';

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
  /** Wave arc width in radians (reserved / flavor) */
  waveArc: number;
  /** Splash radius on impact (0 = none) */
  splashRadius: number;
  /** Multiplier applied to splash damage */
  splashDamageMult: number;

  /** Lateral barrel offset for twin streams (world units) */
  barrelOffset: number;
  /** Per-shot helix angle step (radians) */
  helixStep: number;
  /** Shots before overheat lull (0 = off) */
  overheatShots: number;
  /** Forced cooldown after overheat */
  overheatLull: number;
  /** Laser splits into N bullets on first beam hit (0 = off) */
  refractCount: number;
  /** Homing turn strength (0 = off, ~3–8 typical) */
  homingStrength: number;
  /** Remaining wall/edge bounces */
  ricochetCount: number;
  /** Impulse applied to enemies on hit */
  knockback: number;
  /** Drop damage/slow zones while traveling or on impact */
  trailRadius: number;
  trailDuration: number;
  trailDamagePerSec: number;
  /** Movement multiplier while in trail (1 = none) */
  trailSlowMult: number;
  /** Delayed mine at impact (seconds; 0 = off) */
  mineDelay: number;
  mineRadius: number;
  mineDamageMult: number;
  /** Extra mini-pops around splash */
  clusterCount: number;
  clusterRadius: number;
  clusterDamageMult: number;
  /** Extra damage multiplier vs bossA/bossB */
  bossDamageMult: number;
  /** Soften target after hit */
  armorCrackDuration: number;
  armorCrackMult: number;
  /** Close-range damage ramp */
  pointBlankRange: number;
  pointBlankBonus: number;
  /** Extra damage after each pierce */
  pierceDamageBonus: number;
  /** Spawn spin projectiles from a ring (orbit burst) */
  orbitRadius: number;
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

export interface ScrapHud {
  circuit: number;
  plating: number;
  core: number;
}

export interface GameHudSnapshot {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  timeSec: number;
  kills: number;
  scrap: ScrapHud;
  mapId: MapId;
  mapName: string;
  paused: boolean;
  dead: boolean;
  levelUpPending: boolean;
  levelUpOptions: StatUpgradeOption[];
}

export interface RunResult {
  mapId: MapId;
  mapName: string;
  timeSec: number;
  kills: number;
  level: number;
  scrapEarned: ScrapHud;
  milestonesReached: string[];
}

export type GameEvent =
  | { type: 'hud'; snapshot: GameHudSnapshot }
  | { type: 'levelUp'; options: StatUpgradeOption[] }
  | { type: 'runEnd'; result: RunResult };
