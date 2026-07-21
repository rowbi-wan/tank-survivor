import { Container, Graphics } from 'pixi.js';
import { ARENA_RADIUS, COLORS } from './constants';

export function drawArenaFloor(g: Graphics): void {
  g.clear();
  g.circle(0, 0, ARENA_RADIUS + 80);
  g.fill({ color: COLORS.grassDark });
  g.circle(0, 0, ARENA_RADIUS);
  g.fill({ color: COLORS.grass });

  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = 180 + ((i * 97) % Math.floor(ARENA_RADIUS * 0.85));
    const x = Math.cos(a) * r;
    const y = Math.sin(a * 1.3) * r * 0.9;
    g.circle(x, y, 10 + (i % 5) * 3);
    g.fill({ color: 0xffffff, alpha: 0.12 });
  }

  g.circle(0, 0, ARENA_RADIUS);
  g.stroke({ width: 10, color: 0xffffff, alpha: 0.35 });
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

export function createEnemyGfx(
  radius: number,
  color: number,
  outline: number,
): Graphics {
  const g = new Graphics();
  g.circle(0, 0, radius);
  g.fill({ color });
  g.stroke({ width: 3, color: outline });
  g.circle(-radius * 0.3, -radius * 0.3, radius * 0.25);
  g.fill({ color: 0xffffff, alpha: 0.45 });
  return g;
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

export function createXpGemGfx(): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 7);
  g.fill({ color: COLORS.xp });
  g.stroke({ width: 2, color: COLORS.xpOutline });
  return g;
}

/** Bold screen-space aim reticle (draw white halo then dark core). */
export function createAimReticle(): Graphics {
  const g = new Graphics();
  const arm = 14;
  const gap = 5;
  const outer = 5;
  const inner = 3;

  const drawCross = (width: number, color: number, alpha = 1) => {
    // horizontal arms
    g.moveTo(-(arm + gap), 0);
    g.lineTo(-gap, 0);
    g.moveTo(gap, 0);
    g.lineTo(arm + gap, 0);
    // vertical arms
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
