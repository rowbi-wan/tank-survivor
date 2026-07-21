import type { FireConfig, WeaponBehavior } from '../game/core/types';

export interface WeaponNode {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  /** Soft currency cost to unlock */
  cost: number;
  /** Milestone id required before unlock (survive time / boss) */
  milestoneGate: string | null;
  /** Partial override merged onto ancestor chain when equipped */
  mods: Partial<FireConfig>;
}

export const STARTER_WEAPON_ID = 'cannon-base';

const L3 = 'survive_5';
const L4 = 'survive_10';

/** Starter cannon tree — L3 @ 5:00, L4 @ 10:00 */
export const WEAPON_NODES: WeaponNode[] = [
  {
    id: 'cannon-base',
    name: 'Main Cannon',
    description: 'Single shot every second.',
    parentId: null,
    cost: 0,
    milestoneGate: null,
    mods: {
      fireInterval: 1,
      projectileCount: 1,
      spreadAngle: 0,
      projectileSpeed: 520,
      projectileRadius: 8,
      projectileDamage: 12,
      pierce: 0,
      behavior: 'bullet',
      laserLength: 420,
      waveArc: Math.PI / 3,
      splashRadius: 0,
      splashDamageMult: 1,
      barrelOffset: 0,
      helixStep: 0,
      overheatShots: 0,
      overheatLull: 0,
      refractCount: 0,
      homingStrength: 0,
      ricochetCount: 0,
      knockback: 0,
      trailRadius: 0,
      trailDuration: 0,
      trailDamagePerSec: 0,
      trailSlowMult: 1,
      mineDelay: 0,
      mineRadius: 0,
      mineDamageMult: 1,
      clusterCount: 0,
      clusterRadius: 0,
      clusterDamageMult: 1,
      bossDamageMult: 1,
      armorCrackDuration: 0,
      armorCrackMult: 1.35,
      pointBlankRange: 0,
      pointBlankBonus: 0,
      pierceDamageBonus: 0,
      orbitRadius: 0,
    },
  },

  // —— L2 ——
  {
    id: 'rapid',
    name: 'Rapid Fire',
    description: 'Shoot much faster.',
    parentId: 'cannon-base',
    cost: 100,
    milestoneGate: null,
    mods: { fireInterval: 0.35, projectileDamage: 9 },
  },
  {
    id: 'spread',
    name: 'Spread Shot',
    description: 'Fire three rounds in a fan.',
    parentId: 'cannon-base',
    cost: 100,
    milestoneGate: null,
    mods: { projectileCount: 3, spreadAngle: 0.45, fireInterval: 0.9 },
  },
  {
    id: 'damage-plus',
    name: 'Heavy Shells',
    description: 'Slower, heavier rounds built for big hits.',
    parentId: 'cannon-base',
    cost: 90,
    milestoneGate: null,
    mods: {
      projectileDamage: 16,
      projectileRadius: 10,
      fireInterval: 1.15,
      projectileSpeed: 480,
    },
  },

  // —— Rapid L3 ——
  {
    id: 'super-rapid',
    name: 'Minigun',
    description: 'A high-rate autocannon.',
    parentId: 'rapid',
    cost: 240,
    milestoneGate: L3,
    mods: { fireInterval: 0.12, projectileDamage: 7, projectileSpeed: 600 },
  },
  {
    id: 'laser',
    name: 'Beam Lance',
    description: 'A continuous energy beam.',
    parentId: 'rapid',
    cost: 260,
    milestoneGate: L3,
    mods: {
      behavior: 'laser' as WeaponBehavior,
      fireInterval: 0.08,
      projectileDamage: 6,
      laserLength: 520,
      projectileRadius: 6,
    },
  },
  {
    id: 'pierce-rapid',
    name: 'Piercing Rounds',
    description: 'Rapid shots that pierce one enemy.',
    parentId: 'rapid',
    cost: 180,
    milestoneGate: L3,
    mods: { pierce: 1, projectileDamage: 8 },
  },

  // —— Spread L3 ——
  {
    id: 'wave',
    name: 'Pulse Wave',
    description: 'Wide arc of concussive waves.',
    parentId: 'spread',
    cost: 240,
    milestoneGate: L3,
    mods: {
      behavior: 'wave' as WeaponBehavior,
      projectileCount: 5,
      spreadAngle: 0.9,
      waveArc: Math.PI * 0.7,
      fireInterval: 0.75,
      projectileRadius: 14,
    },
  },
  {
    id: 'spin-360',
    name: 'Omni Burst',
    description: 'Fire in every direction.',
    parentId: 'spread',
    cost: 260,
    milestoneGate: L3,
    mods: {
      behavior: 'spin' as WeaponBehavior,
      projectileCount: 10,
      fireInterval: 0.85,
      spreadAngle: Math.PI * 2,
    },
  },
  {
    id: 'wide-spread',
    name: 'Wide Spread',
    description: 'Five-shot spread.',
    parentId: 'spread',
    cost: 160,
    milestoneGate: L3,
    mods: { projectileCount: 5, spreadAngle: 0.7 },
  },

  // —— Heavy L3 ——
  {
    id: 'slugger',
    name: 'Slugger',
    description: 'Massive slow shells that plow through crowds.',
    parentId: 'damage-plus',
    cost: 170,
    milestoneGate: L3,
    mods: {
      projectileRadius: 20,
      projectileSpeed: 360,
      fireInterval: 1.35,
      projectileDamage: 15,
    },
  },
  {
    id: 'heavy-crush',
    name: 'Armor Piercer',
    description: 'Maximum damage per shot. Aim counts.',
    parentId: 'damage-plus',
    cost: 170,
    milestoneGate: L3,
    mods: {
      projectileDamage: 32,
      fireInterval: 1.45,
      projectileRadius: 12,
      projectileSpeed: 500,
    },
  },
  {
    id: 'heavy-pop',
    name: 'HE Shell',
    description: 'Rounds burst on impact with splash damage.',
    parentId: 'damage-plus',
    cost: 220,
    milestoneGate: L3,
    mods: {
      projectileDamage: 14,
      projectileRadius: 9,
      fireInterval: 1.2,
      splashRadius: 88,
      splashDamageMult: 0.85,
    },
  },

  // —— Minigun L4 ——
  {
    id: 'hailstorm',
    name: 'Hailstorm',
    description: 'Absurd rate of fire. Tiny high-velocity rounds.',
    parentId: 'super-rapid',
    cost: 380,
    milestoneGate: L4,
    mods: {
      fireInterval: 0.05,
      projectileDamage: 4,
      projectileRadius: 5,
      projectileSpeed: 680,
    },
  },
  {
    id: 'twin-barrels',
    name: 'Twin Barrels',
    description: 'Two offset streams of fire.',
    parentId: 'super-rapid',
    cost: 400,
    milestoneGate: L4,
    mods: {
      projectileCount: 2,
      spreadAngle: 0.12,
      barrelOffset: 14,
      fireInterval: 0.1,
      projectileDamage: 6,
    },
  },
  {
    id: 'overheat',
    name: 'Overheat',
    description: 'Blazing burst, then a brief lull to cool down.',
    parentId: 'super-rapid',
    cost: 420,
    milestoneGate: L4,
    mods: {
      fireInterval: 0.04,
      projectileDamage: 5,
      overheatShots: 18,
      overheatLull: 0.85,
    },
  },

  // —— Beam Lance L4 ——
  {
    id: 'laser-plus',
    name: 'Long Beam',
    description: 'Longer, stronger laser.',
    parentId: 'laser',
    cost: 400,
    milestoneGate: L4,
    mods: { laserLength: 700, projectileDamage: 9, fireInterval: 0.06 },
  },
  {
    id: 'wide-beam',
    name: 'Wide Beam',
    description: 'A thicker beam that is easier to land.',
    parentId: 'laser',
    cost: 400,
    milestoneGate: L4,
    mods: {
      projectileRadius: 14,
      projectileDamage: 7,
      laserLength: 560,
      fireInterval: 0.07,
    },
  },
  {
    id: 'refract-beam',
    name: 'Split Beam',
    description: 'On hit, the beam splits into three shards.',
    parentId: 'laser',
    cost: 450,
    milestoneGate: L4,
    mods: {
      refractCount: 3,
      projectileDamage: 5,
      laserLength: 540,
      fireInterval: 0.09,
    },
  },

  // —— Piercing Rounds L4 ——
  {
    id: 'skewer',
    name: 'Skewer',
    description: 'Pierce through more targets.',
    parentId: 'pierce-rapid',
    cost: 380,
    milestoneGate: L4,
    mods: { pierce: 3, projectileDamage: 9, projectileRadius: 6 },
  },
  {
    id: 'drill-bit',
    name: 'Drill Bit',
    description: 'Slower shots that chew harder after each pierce.',
    parentId: 'pierce-rapid',
    cost: 400,
    milestoneGate: L4,
    mods: {
      pierce: 2,
      fireInterval: 0.55,
      projectileDamage: 14,
      pierceDamageBonus: 8,
      projectileSpeed: 440,
    },
  },
  {
    id: 'ricochet-needle',
    name: 'Ricochet Round',
    description: 'Bounces once off the arena edge.',
    parentId: 'pierce-rapid',
    cost: 400,
    milestoneGate: L4,
    mods: {
      ricochetCount: 1,
      pierce: 1,
      projectileDamage: 10,
      projectileSpeed: 620,
    },
  },

  // —— Pulse Wave L4 ——
  {
    id: 'wave-mega',
    name: 'Tidal Pulse',
    description: 'Huge wave with pierce.',
    parentId: 'wave',
    cost: 400,
    milestoneGate: L4,
    mods: {
      pierce: 2,
      projectileCount: 7,
      projectileDamage: 16,
      projectileRadius: 18,
    },
  },
  {
    id: 'foam-trail',
    name: 'Residue Trail',
    description: 'Waves leave a burning residue path behind them.',
    parentId: 'wave',
    cost: 420,
    milestoneGate: L4,
    mods: {
      projectileCount: 5,
      trailRadius: 28,
      trailDuration: 1.4,
      trailDamagePerSec: 18,
      projectileDamage: 12,
    },
  },
  {
    id: 'breaker',
    name: 'Breaker',
    description: 'Fewer waves, huge knockback.',
    parentId: 'wave',
    cost: 400,
    milestoneGate: L4,
    mods: {
      projectileCount: 3,
      spreadAngle: 0.7,
      projectileDamage: 22,
      projectileRadius: 20,
      knockback: 320,
      fireInterval: 0.95,
    },
  },

  // —— Omni Burst L4 ——
  {
    id: 'orbit-burst',
    name: 'Orbit Burst',
    description: 'Pulse rings of fire outward from your tank.',
    parentId: 'spin-360',
    cost: 400,
    milestoneGate: L4,
    mods: {
      behavior: 'spin' as WeaponBehavior,
      projectileCount: 12,
      orbitRadius: 48,
      fireInterval: 0.7,
      projectileDamage: 9,
    },
  },
  {
    id: 'spin-saw',
    name: 'Rotary Spray',
    description: 'A continuous spinning spray of rounds.',
    parentId: 'spin-360',
    cost: 420,
    milestoneGate: L4,
    mods: {
      behavior: 'spin' as WeaponBehavior,
      projectileCount: 8,
      fireInterval: 0.22,
      projectileDamage: 6,
      projectileSpeed: 480,
    },
  },
  {
    id: 'nova-shell',
    name: 'Nova Shell',
    description: 'One huge radial blast. Long cooldown.',
    parentId: 'spin-360',
    cost: 450,
    milestoneGate: L4,
    mods: {
      behavior: 'spin' as WeaponBehavior,
      projectileCount: 18,
      fireInterval: 1.9,
      projectileDamage: 18,
      projectileRadius: 12,
      projectileSpeed: 560,
    },
  },

  // —— Wide Spread L4 ——
  {
    id: 'helix-fan',
    name: 'Helix Spread',
    description: 'A twisting spiral cone of rounds.',
    parentId: 'wide-spread',
    cost: 380,
    milestoneGate: L4,
    mods: {
      projectileCount: 5,
      spreadAngle: 0.75,
      helixStep: 0.35,
      fireInterval: 0.7,
    },
  },
  {
    id: 'homing-suds',
    name: 'Homing Rounds',
    description: 'Soft-homing rounds within the fan.',
    parentId: 'wide-spread',
    cost: 420,
    milestoneGate: L4,
    mods: {
      projectileCount: 5,
      spreadAngle: 0.65,
      homingStrength: 5.5,
      projectileDamage: 10,
    },
  },
  {
    id: 'shot-wall',
    name: 'Shot Wall',
    description: 'A dense mid-cone wall of fire.',
    parentId: 'wide-spread',
    cost: 400,
    milestoneGate: L4,
    mods: {
      projectileCount: 9,
      spreadAngle: 0.55,
      projectileDamage: 8,
      fireInterval: 0.8,
    },
  },

  // —— Slugger L4 ——
  {
    id: 'siege-slug',
    name: 'Siege Slug',
    description: 'Even bigger. Even slower.',
    parentId: 'slugger',
    cost: 400,
    milestoneGate: L4,
    mods: {
      projectileRadius: 28,
      projectileSpeed: 280,
      fireInterval: 1.6,
      projectileDamage: 20,
    },
  },
  {
    id: 'bowling-ball',
    name: 'Wrecking Ball',
    description: 'Pierce and knock foes aside.',
    parentId: 'slugger',
    cost: 420,
    milestoneGate: L4,
    mods: {
      pierce: 2,
      knockback: 380,
      projectileRadius: 18,
      projectileDamage: 18,
      projectileSpeed: 400,
    },
  },
  {
    id: 'sticky-mass',
    name: 'Tar Shell',
    description: 'Leaves a brief slowing residue on impact.',
    parentId: 'slugger',
    cost: 400,
    milestoneGate: L4,
    mods: {
      trailRadius: 55,
      trailDuration: 2.2,
      trailDamagePerSec: 8,
      trailSlowMult: 0.45,
      projectileDamage: 16,
      projectileRadius: 18,
    },
  },

  // —— Armor Piercer L4 ——
  {
    id: 'boss-breaker',
    name: 'Boss Breaker',
    description: 'Shreds elites and bosses.',
    parentId: 'heavy-crush',
    cost: 450,
    milestoneGate: L4,
    mods: {
      bossDamageMult: 2.25,
      projectileDamage: 30,
      fireInterval: 1.4,
    },
  },
  {
    id: 'armor-cracker',
    name: 'Armor Cracker',
    description: 'First hit softens the target for follow-ups.',
    parentId: 'heavy-crush',
    cost: 400,
    milestoneGate: L4,
    mods: {
      armorCrackDuration: 2.5,
      armorCrackMult: 1.45,
      projectileDamage: 28,
    },
  },
  {
    id: 'point-blank',
    name: 'Point Blank',
    description: 'Damage ramps hard at close range.',
    parentId: 'heavy-crush',
    cost: 420,
    milestoneGate: L4,
    mods: {
      pointBlankRange: 160,
      pointBlankBonus: 1.1,
      projectileDamage: 26,
      projectileSpeed: 460,
    },
  },

  // —— HE Shell L4 ——
  {
    id: 'cluster-pop',
    name: 'Cluster Charge',
    description: 'Primary blast plus mini secondary detonations.',
    parentId: 'heavy-pop',
    cost: 420,
    milestoneGate: L4,
    mods: {
      splashRadius: 70,
      splashDamageMult: 0.75,
      clusterCount: 4,
      clusterRadius: 42,
      clusterDamageMult: 0.55,
      projectileDamage: 13,
    },
  },
  {
    id: 'shockwave',
    name: 'Shockwave',
    description: 'Wider splash, softer core blast.',
    parentId: 'heavy-pop',
    cost: 400,
    milestoneGate: L4,
    mods: {
      splashRadius: 140,
      splashDamageMult: 0.55,
      projectileDamage: 11,
    },
  },
  {
    id: 'delayed-charge',
    name: 'Delayed Charge',
    description: 'Delayed second boom at the impact point.',
    parentId: 'heavy-pop',
    cost: 450,
    milestoneGate: L4,
    mods: {
      splashRadius: 75,
      splashDamageMult: 0.7,
      mineDelay: 0.55,
      mineRadius: 100,
      mineDamageMult: 1.1,
      projectileDamage: 12,
    },
  },
];

export function getWeaponNode(id: string): WeaponNode | undefined {
  return WEAPON_NODES.find((n) => n.id === id);
}

export function getChildren(parentId: string): WeaponNode[] {
  return WEAPON_NODES.filter((n) => n.parentId === parentId);
}

/** Ancestor chain from root to node (inclusive). */
export function getPathToNode(nodeId: string): WeaponNode[] {
  const path: WeaponNode[] = [];
  let current = getWeaponNode(nodeId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? getWeaponNode(current.parentId) : undefined;
  }
  return path;
}

export function resolveFireConfig(equippedLeafId: string): FireConfig {
  const path = getPathToNode(equippedLeafId);
  const base: FireConfig = {
    fireInterval: 1,
    projectileCount: 1,
    spreadAngle: 0,
    projectileSpeed: 520,
    projectileRadius: 8,
    projectileDamage: 12,
    pierce: 0,
    behavior: 'bullet',
    laserLength: 420,
    waveArc: Math.PI / 3,
    splashRadius: 0,
    splashDamageMult: 1,
    barrelOffset: 0,
    helixStep: 0,
    overheatShots: 0,
    overheatLull: 0,
    refractCount: 0,
    homingStrength: 0,
    ricochetCount: 0,
    knockback: 0,
    trailRadius: 0,
    trailDuration: 0,
    trailDamagePerSec: 0,
    trailSlowMult: 1,
    mineDelay: 0,
    mineRadius: 0,
    mineDamageMult: 1,
    clusterCount: 0,
    clusterRadius: 0,
    clusterDamageMult: 1,
    bossDamageMult: 1,
    armorCrackDuration: 0,
    armorCrackMult: 1.35,
    pointBlankRange: 0,
    pointBlankBonus: 0,
    pierceDamageBonus: 0,
    orbitRadius: 0,
  };
  for (const node of path) {
    Object.assign(base, node.mods);
  }
  return base;
}

/** Valid equip targets: unlocked nodes that form a contiguous path from root. */
export function isLegalEquip(
  nodeId: string,
  unlocked: ReadonlySet<string>,
): boolean {
  const path = getPathToNode(nodeId);
  if (path.length === 0) return false;
  return path.every((n) => unlocked.has(n.id));
}
