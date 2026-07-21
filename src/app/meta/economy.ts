import type { EnemyKind } from '../game/core/types';

export type ScrapType = 'circuit' | 'plating' | 'core';

export interface ScrapBundle {
  circuit: number;
  plating: number;
  core: number;
}

export const SCRAP_TYPES: ScrapType[] = ['circuit', 'plating', 'core'];

export const SCRAP_LABEL: Record<ScrapType, string> = {
  circuit: 'Circuit',
  plating: 'Plating',
  core: 'Core',
};

/** HUD / pickup colors */
export const SCRAP_COLOR: Record<ScrapType, number> = {
  circuit: 0x7fe9ff,
  plating: 0xc0c8d4,
  core: 0xffb347,
};

export const SCRAP_OUTLINE: Record<ScrapType, number> = {
  circuit: 0x2a8fa0,
  plating: 0x5a6570,
  core: 0xe07a2a,
};

export function emptyScrap(): ScrapBundle {
  return { circuit: 0, plating: 0, core: 0 };
}

export function addScrap(a: ScrapBundle, b: ScrapBundle): ScrapBundle {
  return {
    circuit: a.circuit + b.circuit,
    plating: a.plating + b.plating,
    core: a.core + b.core,
  };
}

export function canAfford(balance: ScrapBundle, cost: ScrapBundle): boolean {
  return (
    balance.circuit >= cost.circuit &&
    balance.plating >= cost.plating &&
    balance.core >= cost.core
  );
}

export function subtractScrap(
  balance: ScrapBundle,
  cost: ScrapBundle,
): ScrapBundle {
  return {
    circuit: balance.circuit - cost.circuit,
    plating: balance.plating - cost.plating,
    core: balance.core - cost.core,
  };
}

export function scrapTotal(b: ScrapBundle): number {
  return b.circuit + b.plating + b.core;
}

/** Format costs for Hangar buttons, e.g. "C80 · P20 · K10" */
export function formatScrapCost(cost: ScrapBundle): string {
  const parts: string[] = [];
  if (cost.circuit) parts.push(`C${cost.circuit}`);
  if (cost.plating) parts.push(`P${cost.plating}`);
  if (cost.core) parts.push(`K${cost.core}`);
  return parts.length ? parts.join(' · ') : 'Free';
}

export function formatScrapShortage(
  balance: ScrapBundle,
  cost: ScrapBundle,
): string {
  const missing: string[] = [];
  if (balance.circuit < cost.circuit) missing.push('Circuit');
  if (balance.plating < cost.plating) missing.push('Plating');
  if (balance.core < cost.core) missing.push('Core');
  return missing.length ? `Need ${missing.join(', ')}` : 'Not enough scrap';
}

/** Single-currency L2/L3 helper */
export function circuitOnly(n: number): ScrapBundle {
  return { circuit: n, plating: 0, core: 0 };
}
export function platingOnly(n: number): ScrapBundle {
  return { circuit: 0, plating: n, core: 0 };
}
export function coreOnly(n: number): ScrapBundle {
  return { circuit: 0, plating: 0, core: n };
}

/**
 * L4 primary-heavy recipe from an old single-cost scale.
 * ~70% branch primary, ~20% secondary, ~10% tertiary.
 */
export function rapidLeafCost(scale: number): ScrapBundle {
  return {
    circuit: Math.round(scale * 0.7),
    plating: Math.round(scale * 0.2),
    core: Math.round(scale * 0.1),
  };
}
export function spreadLeafCost(scale: number): ScrapBundle {
  return {
    plating: Math.round(scale * 0.7),
    circuit: Math.round(scale * 0.2),
    core: Math.round(scale * 0.1),
  };
}
export function heavyLeafCost(scale: number): ScrapBundle {
  return {
    core: Math.round(scale * 0.7),
    plating: Math.round(scale * 0.2),
    circuit: Math.round(scale * 0.1),
  };
}

/** Per-kill scrap drop tables (role-mapped mixes). */
export function scrapDropForEnemy(kind: EnemyKind): ScrapBundle {
  switch (kind) {
    case 'swarm':
      return { circuit: 2, plating: 1, core: 0 };
    case 'chaser':
      return { circuit: 2, plating: 2, core: 0 };
    case 'spitter':
      return { circuit: 3, plating: 0, core: 1 };
    case 'brute':
      return { circuit: 0, plating: 4, core: 1 };
    case 'exploder':
      return { circuit: 0, plating: 1, core: 3 };
    case 'bossA':
      return { circuit: 12, plating: 18, core: 8 };
    case 'bossB':
      return { circuit: 14, plating: 10, core: 20 };
    default:
      return emptyScrap();
  }
}

/** Expand a scrap bundle into individual shard spawns (one pickup each). */
export function expandScrapShards(drop: ScrapBundle): ScrapType[] {
  const out: ScrapType[] = [];
  for (let i = 0; i < drop.circuit; i++) out.push('circuit');
  for (let i = 0; i < drop.plating; i++) out.push('plating');
  for (let i = 0; i < drop.core; i++) out.push('core');
  return out;
}
