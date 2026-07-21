import { Container, Graphics } from 'pixi.js';
import { SCRAP_COLOR, SCRAP_OUTLINE, type ScrapType } from '../../meta/economy';
import type { MapDef } from '../../meta/maps';
import { COLORS } from './constants';
import type { EnemyKind } from './types';

export function drawArenaFloor(g: Graphics, map: MapDef): void {
  const radius = map.arenaRadius;
  const { grass, grassDark, wall, wallOutline } = map.palette;
  g.clear();
  g.circle(0, 0, radius + 80);
  g.fill({ color: grassDark });
  g.circle(0, 0, radius);
  g.fill({ color: grass });

  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = 180 + ((i * 97) % Math.floor(radius * 0.85));
    const x = Math.cos(a) * r;
    const y = Math.sin(a * 1.3) * r * 0.9;
    g.circle(x, y, 10 + (i % 5) * 3);
    g.fill({ color: 0xffffff, alpha: 0.12 });
  }

  g.circle(0, 0, radius);
  g.stroke({ width: 10, color: 0xffffff, alpha: 0.35 });

  for (const w of map.walls) {
    g.roundRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h, 8);
    g.fill({ color: wall });
    g.stroke({ width: 3, color: wallOutline });
  }
}

export type TankView = Container & { hull: Graphics; turret: Graphics };

export function createTankGraphics(): TankView {
  const root = new Container() as TankView;
  const hull = new Graphics();
  hull.roundRect(-22, -16, 44, 32, 14);
  hull.fill({ color: COLORS.tankHull });
  hull.stroke({ width: 4, color: COLORS.tankHullOutline });
  hull.roundRect(-26, -20, 12, 40, 8);
  hull.fill({ color: COLORS.tankHullOutline });
  hull.roundRect(14, -20, 12, 40, 8);
  hull.fill({ color: COLORS.tankHullOutline });

  const turret = new Graphics();
  turret.circle(0, 0, 12);
  turret.fill({ color: COLORS.tankTurret });
  turret.stroke({ width: 3, color: COLORS.tankTurretOutline });
  turret.roundRect(4, -5, 28, 10, 5);
  turret.fill({ color: COLORS.tankTurret });
  turret.stroke({ width: 3, color: COLORS.tankTurretOutline });

  root.addChild(hull);
  root.addChild(turret);
  root.hull = hull;
  root.turret = turret;
  return root;
}

/** Placeholder pooled enemy graphic — redrawn per spawn via drawRobotEnemy. */
export function createEnemyGfx(): Graphics {
  return new Graphics();
}

/** Flat industrial robot silhouettes; facing +X (rotation aims at player). */
export function drawRobotEnemy(
  g: Graphics,
  kind: EnemyKind,
  radius: number,
  color: number,
  outline: number,
): void {
  g.clear();
  const r = radius;
  const stroke = kind.startsWith('boss') ? 4 : 3;
  const eye = 0x7fe9ff;
  const eyeHot = 0xff6b6b;
  const dark = outline;

  const body = () => {
    g.roundRect(-r * 0.85, -r * 0.7, r * 1.7, r * 1.4, r * 0.25);
    g.fill({ color });
    g.stroke({ width: stroke, color: dark });
  };

  const optic = (x: number, y: number, size: number, hot = false) => {
    g.circle(x, y, size);
    g.fill({ color: hot ? eyeHot : eye });
    g.stroke({ width: 2, color: dark });
  };

  switch (kind) {
    case 'swarm': {
      g.roundRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4, r * 0.2);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      optic(r * 0.15, -r * 0.05, r * 0.28);
      g.moveTo(0, -r * 0.7);
      g.lineTo(0, -r * 1.15);
      g.stroke({ width: 3, color: dark });
      g.circle(0, -r * 1.2, r * 0.18);
      g.fill({ color: eye });
      break;
    }
    case 'chaser': {
      body();
      g.roundRect(-r * 0.45, -r * 1.05, r * 0.9, r * 0.45, r * 0.15);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      optic(r * 0.2, -r * 0.85, r * 0.22);
      g.roundRect(r * 0.55, -r * 0.2, r * 0.55, r * 0.4, 3);
      g.fill({ color: dark });
      break;
    }
    case 'brute': {
      g.roundRect(-r * 1.05, -r * 0.75, r * 2.1, r * 1.5, r * 0.2);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      g.roundRect(-r * 1.15, -r * 0.95, r * 0.55, r * 0.55, 4);
      g.fill({ color: dark });
      g.roundRect(r * 0.6, -r * 0.95, r * 0.55, r * 0.55, 4);
      g.fill({ color: dark });
      optic(-r * 0.25, -r * 0.15, r * 0.18, true);
      optic(r * 0.25, -r * 0.15, r * 0.18, true);
      break;
    }
    case 'spitter': {
      body();
      g.roundRect(r * 0.4, -r * 0.22, r * 0.95, r * 0.44, 4);
      g.fill({ color: dark });
      g.roundRect(r * 1.15, -r * 0.14, r * 0.45, r * 0.28, 3);
      g.fill({ color: 0xcaffbf });
      optic(0, -r * 0.25, r * 0.24);
      break;
    }
    case 'exploder': {
      g.circle(0, 0, r * 0.95);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      // warning bands
      g.rect(-r * 0.9, -r * 0.2, r * 1.8, r * 0.18);
      g.fill({ color: 0xffe066 });
      g.rect(-r * 0.9, r * 0.05, r * 1.8, r * 0.18);
      g.fill({ color: dark });
      optic(0, -r * 0.35, r * 0.22, true);
      g.moveTo(0, -r * 0.95);
      g.lineTo(0, -r * 1.35);
      g.stroke({ width: 3, color: dark });
      g.circle(0, -r * 1.4, r * 0.2);
      g.fill({ color: eyeHot });
      break;
    }
    case 'bossA': {
      g.roundRect(-r * 1.1, -r * 0.85, r * 2.2, r * 1.7, r * 0.25);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      g.roundRect(-r * 0.7, -r * 1.25, r * 1.4, r * 0.55, r * 0.15);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      optic(-r * 0.35, -r * 1.0, r * 0.22);
      optic(r * 0.35, -r * 1.0, r * 0.22);
      g.roundRect(r * 0.7, -r * 0.25, r * 0.9, r * 0.5, 5);
      g.fill({ color: dark });
      break;
    }
    case 'bossB': {
      g.roundRect(-r * 1.15, -r * 0.8, r * 2.3, r * 1.6, r * 0.2);
      g.fill({ color });
      g.stroke({ width: stroke, color: dark });
      g.ellipse(-r * 1.2, 0, r * 0.45, r * 0.7);
      g.fill({ color: dark });
      g.ellipse(r * 1.2, 0, r * 0.45, r * 0.7);
      g.fill({ color: dark });
      optic(-r * 0.35, -r * 0.25, r * 0.2, true);
      optic(r * 0.35, -r * 0.25, r * 0.2, true);
      optic(0, -r * 0.55, r * 0.16);
      break;
    }
    default: {
      body();
      optic(r * 0.15, -r * 0.1, r * 0.25);
    }
  }
}

export function createProjectileGfx(
  radius: number,
  color: number,
  outline: number,
): Graphics {
  const g = new Graphics();
  g.circle(0, 0, radius);
  g.fill({ color });
  g.stroke({ width: 2, color: outline });
  return g;
}

/** Colored scrap shard pickup (circuit / plating / core). */
export function createScrapShardGfx(type: ScrapType = 'plating'): Graphics {
  const g = new Graphics();
  paintScrapShard(g, type);
  return g;
}

export function paintScrapShard(g: Graphics, type: ScrapType): void {
  g.clear();
  g.moveTo(0, -8);
  g.lineTo(7, -2);
  g.lineTo(5, 7);
  g.lineTo(-6, 6);
  g.lineTo(-8, -3);
  g.closePath();
  g.fill({ color: SCRAP_COLOR[type] });
  g.stroke({ width: 2, color: SCRAP_OUTLINE[type] });
  g.moveTo(-2, -1);
  g.lineTo(3, 2);
  g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.55 });
}

/** Bold screen-space aim reticle (draw white halo then dark core). */
export function createAimReticle(): Graphics {
  const g = new Graphics();
  const arm = 14;
  const gap = 5;
  const outer = 5;
  const inner = 3;

  const drawCross = (width: number, color: number, alpha = 1) => {
    g.moveTo(-(arm + gap), 0);
    g.lineTo(-gap, 0);
    g.moveTo(gap, 0);
    g.lineTo(arm + gap, 0);
    g.moveTo(0, -(arm + gap));
    g.lineTo(0, -gap);
    g.moveTo(0, gap);
    g.lineTo(0, arm + gap);
    g.stroke({ width, color, alpha, cap: 'round' });
  };

  drawCross(outer, 0xffffff, 0.95);
  drawCross(inner, COLORS.uiInk, 1);

  g.circle(0, 0, 3.5);
  g.stroke({ width: 3, color: 0xffffff, alpha: 0.95 });
  g.circle(0, 0, 3.5);
  g.stroke({ width: 2, color: COLORS.uiInk });

  g.eventMode = 'none';
  return g;
}
