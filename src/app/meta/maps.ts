import type { EnemyKind } from '../game/core/types';

export type MapId = 'open-yard' | 'ruined-depot' | 'tight-foundry';

/** Axis-aligned wall rect; x/y are center. */
export interface RectWall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapPalette {
  skyTop: number;
  skyBottom: number;
  grass: number;
  grassDark: number;
  wall: number;
  wallOutline: number;
}

/** Time-gated spawn weights (higher = more likely after unlockTime). */
export interface SpawnWeight {
  kind: Exclude<EnemyKind, 'bossA' | 'bossB'>;
  weight: number;
  /** Seconds before this kind can appear */
  unlockTime: number;
}

export interface MapDef {
  id: MapId;
  name: string;
  blurb: string;
  /** Hangar card image under /public */
  thumbnail: string;
  arenaRadius: number;
  walls: RectWall[];
  palette: MapPalette;
  densityMult: number;
  spawnWeights: SpawnWeight[];
}

export const MAP_UNLOCK_TIME_SEC = 20 * 60;

export const STARTER_MAP_ID: MapId = 'open-yard';

export const MAPS: MapDef[] = [
  {
    id: 'open-yard',
    name: 'Open Yard',
    blurb: 'Wide grass circle. Learn the ropes against swarms.',
    thumbnail: '/maps/open-yard.png',
    arenaRadius: 2200,
    walls: [],
    palette: {
      skyTop: 0xb8e4ff,
      skyBottom: 0xe8f7ff,
      grass: 0x9fd98a,
      grassDark: 0x7fc46a,
      wall: 0x8a7a6a,
      wallOutline: 0x4a4038,
    },
    densityMult: 1,
    spawnWeights: [
      { kind: 'swarm', weight: 45, unlockTime: 0 },
      { kind: 'chaser', weight: 40, unlockTime: 0 },
      { kind: 'brute', weight: 18, unlockTime: 45 },
      { kind: 'spitter', weight: 12, unlockTime: 90 },
      { kind: 'exploder', weight: 6, unlockTime: 180 },
    ],
  },
  {
    id: 'ruined-depot',
    name: 'Ruined Depot',
    blurb: 'Medium arena with scrap cover. Brutes and spitters lean in.',
    thumbnail: '/maps/ruined-depot.png',
    arenaRadius: 1700,
    walls: [
      { x: -420, y: -280, w: 220, h: 80 },
      { x: 380, y: -320, w: 180, h: 100 },
      { x: -300, y: 360, w: 260, h: 70 },
      { x: 440, y: 200, w: 90, h: 240 },
      { x: 40, y: -40, w: 140, h: 140 },
      { x: -700, y: 80, w: 100, h: 280 },
      { x: 720, y: -100, w: 120, h: 200 },
    ],
    palette: {
      skyTop: 0xc4c8d0,
      skyBottom: 0xe4e6ea,
      grass: 0x8a9080,
      grassDark: 0x6a7060,
      wall: 0x6e6460,
      wallOutline: 0x3a3432,
    },
    densityMult: 1.18,
    spawnWeights: [
      { kind: 'swarm', weight: 22, unlockTime: 0 },
      { kind: 'chaser', weight: 28, unlockTime: 0 },
      { kind: 'brute', weight: 32, unlockTime: 30 },
      { kind: 'spitter', weight: 28, unlockTime: 60 },
      { kind: 'exploder', weight: 10, unlockTime: 150 },
    ],
  },
  {
    id: 'tight-foundry',
    name: 'Tight Foundry',
    blurb: 'Cramped floor and dense walls. Exploders and pressure.',
    thumbnail: '/maps/tight-foundry.png',
    arenaRadius: 1300,
    walls: [
      { x: -280, y: -280, w: 160, h: 60 },
      { x: 280, y: -280, w: 160, h: 60 },
      { x: -280, y: 280, w: 160, h: 60 },
      { x: 280, y: 280, w: 160, h: 60 },
      { x: 0, y: -420, w: 80, h: 200 },
      { x: 0, y: 420, w: 80, h: 200 },
      { x: -420, y: 0, w: 200, h: 80 },
      { x: 420, y: 0, w: 200, h: 80 },
      { x: -150, y: 0, w: 50, h: 180 },
      { x: 150, y: 0, w: 50, h: 180 },
      { x: 0, y: -150, w: 180, h: 50 },
      { x: 0, y: 150, w: 180, h: 50 },
    ],
    palette: {
      skyTop: 0xd4a090,
      skyBottom: 0xf0d0c0,
      grass: 0x7a6a5a,
      grassDark: 0x5a4a3a,
      wall: 0x5a5058,
      wallOutline: 0x2a2428,
    },
    densityMult: 1.35,
    spawnWeights: [
      { kind: 'swarm', weight: 15, unlockTime: 0 },
      { kind: 'chaser', weight: 30, unlockTime: 0 },
      { kind: 'brute', weight: 22, unlockTime: 25 },
      { kind: 'spitter', weight: 20, unlockTime: 50 },
      { kind: 'exploder', weight: 30, unlockTime: 90 },
    ],
  },
];

export function getMap(id: MapId): MapDef {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

export function emptyBestTimes(): Record<MapId, number> {
  return {
    'open-yard': 0,
    'ruined-depot': 0,
    'tight-foundry': 0,
  };
}

/** Map at index i unlocks when prior map best ≥ MAP_UNLOCK_TIME_SEC (index 0 always). */
export function isMapUnlocked(
  mapId: MapId,
  bestTimeByMap: Record<MapId, number>,
): boolean {
  const idx = MAPS.findIndex((m) => m.id === mapId);
  if (idx <= 0) return true;
  const prev = MAPS[idx - 1]!;
  return (bestTimeByMap[prev.id] ?? 0) >= MAP_UNLOCK_TIME_SEC;
}

export function mapUnlockHint(
  mapId: MapId,
  bestTimeByMap: Record<MapId, number>,
): string | null {
  if (isMapUnlocked(mapId, bestTimeByMap)) return null;
  const idx = MAPS.findIndex((m) => m.id === mapId);
  if (idx <= 0) return null;
  const prev = MAPS[idx - 1]!;
  return `Survive 20:00 on ${prev.name}`;
}

export function pickMapEnemyKind(map: MapDef, timeSec: number): EnemyKind {
  const eligible = map.spawnWeights.filter((w) => timeSec >= w.unlockTime);
  const pool = eligible.length ? eligible : map.spawnWeights;
  const total = pool.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of pool) {
    roll -= w.weight;
    if (roll <= 0) return w.kind;
  }
  return pool[pool.length - 1]?.kind ?? 'chaser';
}

/** Circle vs AABB (wall center + size). Returns overlap push or null. */
export function circleWallPush(
  cx: number,
  cy: number,
  radius: number,
  wall: RectWall,
): { x: number; y: number } | null {
  const halfW = wall.w / 2;
  const halfH = wall.h / 2;
  const nearestX = Math.max(wall.x - halfW, Math.min(cx, wall.x + halfW));
  const nearestY = Math.max(wall.y - halfH, Math.min(cy, wall.y + halfH));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= radius * radius) return null;
  if (distSq < 1e-8) {
    // Center inside rect: push out along shortest axis
    const overlapX = halfW + radius - Math.abs(cx - wall.x);
    const overlapY = halfH + radius - Math.abs(cy - wall.y);
    if (overlapX < overlapY) {
      return { x: Math.sign(cx - wall.x || 1) * overlapX, y: 0 };
    }
    return { x: 0, y: Math.sign(cy - wall.y || 1) * overlapY };
  }
  const dist = Math.sqrt(distSq);
  const push = radius - dist;
  return { x: (dx / dist) * push, y: (dy / dist) * push };
}

export function resolveCircleWalls(
  x: number,
  y: number,
  radius: number,
  walls: RectWall[],
): { x: number; y: number } {
  let px = x;
  let py = y;
  for (let pass = 0; pass < 3; pass++) {
    for (const wall of walls) {
      const push = circleWallPush(px, py, radius, wall);
      if (push) {
        px += push.x;
        py += push.y;
      }
    }
  }
  return { x: px, y: py };
}

/** First wall hit along a ray; returns distance from origin (or null). */
export function raycastWalls(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  maxDist: number,
  walls: RectWall[],
): number | null {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  let best: number | null = null;

  for (const wall of walls) {
    const halfW = wall.w / 2;
    const halfH = wall.h / 2;
    const minX = wall.x - halfW;
    const maxX = wall.x + halfW;
    const minY = wall.y - halfH;
    const maxY = wall.y + halfH;

    // Slab method
    let tMin = 0;
    let tMax = maxDist;
    if (Math.abs(ux) < 1e-8) {
      if (ox < minX || ox > maxX) continue;
    } else {
      let t1 = (minX - ox) / ux;
      let t2 = (maxX - ox) / ux;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) continue;
    }
    if (Math.abs(uy) < 1e-8) {
      if (oy < minY || oy > maxY) continue;
    } else {
      let t1 = (minY - oy) / uy;
      let t2 = (maxY - oy) / uy;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) continue;
    }
    if (tMin > 0 && tMin <= maxDist) {
      if (best === null || tMin < best) best = tMin;
    } else if (tMin <= 0 && tMax > 0 && tMax <= maxDist) {
      // Origin inside — treat as immediate block at small epsilon
      if (best === null || 0.01 < best) best = 0.01;
    }
  }
  return best;
}

/** Reflect velocity off wall normal when circle hits AABB. */
export function bounceOffWall(
  vx: number,
  vy: number,
  cx: number,
  cy: number,
  wall: RectWall,
): { vx: number; vy: number } {
  const halfW = wall.w / 2;
  const halfH = wall.h / 2;
  const nearestX = Math.max(wall.x - halfW, Math.min(cx, wall.x + halfW));
  const nearestY = Math.max(wall.y - halfH, Math.min(cy, wall.y + halfH));
  let nx = cx - nearestX;
  let ny = cy - nearestY;
  const nLen = Math.hypot(nx, ny);
  if (nLen < 1e-6) {
    const overlapX = halfW - Math.abs(cx - wall.x);
    const overlapY = halfH - Math.abs(cy - wall.y);
    if (overlapX < overlapY) {
      nx = Math.sign(cx - wall.x || 1);
      ny = 0;
    } else {
      nx = 0;
      ny = Math.sign(cy - wall.y || 1);
    }
  } else {
    nx /= nLen;
    ny /= nLen;
  }
  const dot = vx * nx + vy * ny;
  return { vx: vx - 2 * dot * nx, vy: vy - 2 * dot * ny };
}
