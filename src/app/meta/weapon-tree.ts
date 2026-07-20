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

/** ~12-node starter cannon tree */
export const WEAPON_NODES: WeaponNode[] = [
  {
    id: 'cannon-base',
    name: 'Bubble Cannon',
    description: 'Single bubbly shot every second.',
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
    },
  },
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
    description: 'Fire three bubbles in a fan.',
    parentId: 'cannon-base',
    cost: 100,
    milestoneGate: null,
    mods: { projectileCount: 3, spreadAngle: 0.45, fireInterval: 0.9 },
  },
  {
    id: 'damage-plus',
    name: 'Heavy Bubbles',
    description: 'Bigger, harder-hitting shots.',
    parentId: 'cannon-base',
    cost: 90,
    milestoneGate: null,
    mods: { projectileDamage: 18, projectileRadius: 11 },
  },
  {
    id: 'super-rapid',
    name: 'Super Rapid',
    description: 'A candy machine gun.',
    parentId: 'rapid',
    cost: 240,
    milestoneGate: 'survive_5',
    mods: { fireInterval: 0.12, projectileDamage: 7, projectileSpeed: 600 },
  },
  {
    id: 'laser',
    name: 'Sugar Laser',
    description: 'A continuous candy beam.',
    parentId: 'rapid',
    cost: 260,
    milestoneGate: 'survive_5',
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
    name: 'Needle Gum',
    description: 'Rapid shots pierce one enemy.',
    parentId: 'rapid',
    cost: 180,
    milestoneGate: null,
    mods: { pierce: 1, projectileDamage: 8 },
  },
  {
    id: 'wave',
    name: 'Wave Blast',
    description: 'Wide arc of bubble waves.',
    parentId: 'spread',
    cost: 240,
    milestoneGate: 'survive_5',
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
    name: '360 Pop',
    description: 'Fire bubbles in every direction.',
    parentId: 'spread',
    cost: 260,
    milestoneGate: 'survive_5',
    mods: {
      behavior: 'spin' as WeaponBehavior,
      projectileCount: 10,
      fireInterval: 0.85,
      spreadAngle: Math.PI * 2,
    },
  },
  {
    id: 'wide-spread',
    name: 'Wider Fan',
    description: 'Five-shot spread.',
    parentId: 'spread',
    cost: 160,
    milestoneGate: null,
    mods: { projectileCount: 5, spreadAngle: 0.7 },
  },
  {
    id: 'laser-plus',
    name: 'Long Beam',
    description: 'Longer, stronger laser.',
    parentId: 'laser',
    cost: 400,
    milestoneGate: 'survive_10',
    mods: { laserLength: 700, projectileDamage: 9, fireInterval: 0.06 },
  },
  {
    id: 'wave-mega',
    name: 'Tsunami Gum',
    description: 'Huge wave with pierce.',
    parentId: 'wave',
    cost: 400,
    milestoneGate: 'survive_10',
    mods: {
      pierce: 2,
      projectileCount: 7,
      projectileDamage: 16,
      projectileRadius: 18,
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
