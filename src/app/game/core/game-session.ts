import { Container, Graphics } from 'pixi.js';
import { scrapForRun } from '../../meta/economy';
import {
  ARENA_RADIUS,
  BOSS_A_TIME,
  BOSS_B_TIME,
  COLORS,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  MAX_XP_GEMS,
  PLAYER_HIT_RADIUS,
  STAT_POOL,
  Z_ENEMY,
  Z_GEM,
  Z_PLAYER,
  Z_PROJECTILE,
} from './constants';
import {
  createBubbleEnemy,
  createProjectileGfx,
  createTankGraphics,
  createXpGemGfx,
  drawArenaFloor,
  type TankView,
} from './graphics';
import { InputState } from './input';
import type {
  EnemyKind,
  FireConfig,
  GameEvent,
  GameHudSnapshot,
  PlayerStats,
  RunResult,
  StatUpgradeOption,
} from './types';

interface Projectile {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierceLeft: number;
  life: number;
  kind: 'bullet' | 'laser' | 'wave';
  hitIds: Set<number>;
  gfx: Graphics;
}

interface Enemy {
  active: boolean;
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xp: number;
  shootCooldown: number;
  phaseTimer: number;
  gfx: Graphics;
}

interface XpGem {
  active: boolean;
  x: number;
  y: number;
  value: number;
  gfx: Graphics;
}

let nextEnemyId = 1;

function xpForLevel(level: number): number {
  return Math.floor(12 + level * 8 + level * level * 1.5);
}

function defaultPlayer(): PlayerStats {
  return {
    maxHp: 100,
    hp: 100,
    moveSpeed: 210,
    damageMult: 1,
    fireRateMult: 1,
    pickupRadius: 70,
    xp: 0,
    level: 1,
    xpToNext: xpForLevel(1),
  };
}

export class GameSession {
  readonly world = new Container();
  readonly input: InputState;

  private readonly floor = new Graphics();
  private readonly entityLayer = new Container();
  private readonly tank: TankView;
  private readonly projectiles: Projectile[] = [];
  private readonly enemies: Enemy[] = [];
  private readonly gems: XpGem[] = [];

  private playerX = 0;
  private playerY = 0;
  private hullAngle = 0;
  private turretAngle = 0;
  private fireCooldown = 0;
  private iFrames = 0;
  private spawnAcc = 0;
  private timeSec = 0;
  stats = defaultPlayer();
  kills = 0;
  private milestonesReached = new Set<string>();
  private bossASpawned = false;
  private bossBSpawned = false;
  private dead = false;
  private paused = false;
  private levelUpPending = false;
  private levelUpOptions: StatUpgradeOption[] = [];
  private viewW = 800;
  private viewH = 600;
  private fireConfig: FireConfig;
  private readonly onEvent: (e: GameEvent) => void;
  private hudAcc = 0;

  constructor(
    input: InputState,
    fireConfig: FireConfig,
    onEvent: (e: GameEvent) => void,
  ) {
    this.input = input;
    this.fireConfig = fireConfig;
    this.onEvent = onEvent;

    drawArenaFloor(this.floor);
    this.world.addChild(this.floor);
    this.entityLayer.sortableChildren = true;
    this.world.addChild(this.entityLayer);

    this.tank = createTankGraphics();
    this.tank.zIndex = Z_PLAYER;
    this.entityLayer.addChild(this.tank);

    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const gfx = createProjectileGfx(8, COLORS.bullet, COLORS.bulletOutline);
      gfx.visible = false;
      gfx.zIndex = Z_PROJECTILE;
      this.entityLayer.addChild(gfx);
      this.projectiles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 8,
        damage: 1,
        pierceLeft: 0,
        life: 0,
        kind: 'bullet',
        hitIds: new Set(),
        gfx,
      });
    }
    for (let i = 0; i < MAX_ENEMIES; i++) {
      const gfx = createBubbleEnemy(16, 0xff9aa2, 0xd45d7a);
      gfx.visible = false;
      gfx.zIndex = Z_ENEMY;
      this.entityLayer.addChild(gfx);
      this.enemies.push({
        active: false,
        id: 0,
        kind: 'chaser',
        x: 0,
        y: 0,
        hp: 1,
        maxHp: 1,
        speed: 80,
        radius: 16,
        contactDamage: 8,
        xp: 1,
        shootCooldown: 0,
        phaseTimer: 0,
        gfx,
      });
    }
    for (let i = 0; i < MAX_XP_GEMS; i++) {
      const gfx = createXpGemGfx();
      gfx.visible = false;
      gfx.zIndex = Z_GEM;
      this.entityLayer.addChild(gfx);
      this.gems.push({ active: false, x: 0, y: 0, value: 1, gfx });
    }

    this.emitHud();
  }

  setViewSize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
  }

  updateFireConfig(config: FireConfig): void {
    this.fireConfig = config;
  }

  chooseUpgrade(id: StatUpgradeOption['id']): void {
    if (!this.levelUpPending) return;
    switch (id) {
      case 'maxHp':
        this.stats.maxHp += 20;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 20);
        break;
      case 'moveSpeed':
        this.stats.moveSpeed *= 1.12;
        break;
      case 'damage':
        this.stats.damageMult *= 1.15;
        break;
      case 'fireRate':
        this.stats.fireRateMult *= 1.12;
        break;
      case 'pickupRadius':
        this.stats.pickupRadius *= 1.25;
        break;
    }
    this.levelUpPending = false;
    this.levelUpOptions = [];
    this.paused = false;
    this.emitHud();
  }

  update(dt: number): void {
    if (this.dead) return;
    this.hudAcc += dt;
    if (this.hudAcc >= 0.1) {
      this.hudAcc = 0;
      this.emitHud();
    }
    if (this.paused || this.levelUpPending) {
      this.syncCamera();
      return;
    }

    this.timeSec += dt;
    this.checkMilestones();
    this.updatePlayer(dt);
    this.updateShooting(dt);
    this.updateSpawns(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateGems(dt);
    this.syncCamera();

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.dead = true;
      this.emitHud();
      this.onEvent({ type: 'runEnd', result: this.buildResult() });
    }
  }

  destroy(): void {
    this.world.destroy({ children: true });
  }

  private buildResult(): RunResult {
    return {
      timeSec: this.timeSec,
      kills: this.kills,
      level: this.stats.level,
      currencyEarned: scrapForRun(this.timeSec, this.kills),
      milestonesReached: [...this.milestonesReached],
    };
  }

  private checkMilestones(): void {
    if (this.timeSec >= 60) this.milestonesReached.add('survive_1');
    if (this.timeSec >= BOSS_A_TIME) this.milestonesReached.add('survive_5');
    if (this.timeSec >= BOSS_B_TIME) this.milestonesReached.add('survive_10');

    if (!this.bossASpawned && this.timeSec >= BOSS_A_TIME) {
      this.bossASpawned = true;
      this.spawnEnemy('bossA', true);
    }
    if (!this.bossBSpawned && this.timeSec >= BOSS_B_TIME) {
      this.bossBSpawned = true;
      this.spawnEnemy('bossB', true);
    }
  }

  private updatePlayer(dt: number): void {
    const axis = this.input.axis();
    this.playerX += axis.x * this.stats.moveSpeed * dt;
    this.playerY += axis.y * this.stats.moveSpeed * dt;

    const dist = Math.hypot(this.playerX, this.playerY);
    if (dist > ARENA_RADIUS) {
      const s = ARENA_RADIUS / dist;
      this.playerX *= s;
      this.playerY *= s;
    }

    if (axis.x !== 0 || axis.y !== 0) {
      this.hullAngle = Math.atan2(axis.y, axis.x);
    }

    const worldMouseX = this.input.mouseX - this.viewW / 2 + this.playerX;
    const worldMouseY = this.input.mouseY - this.viewH / 2 + this.playerY;
    this.turretAngle = Math.atan2(
      worldMouseY - this.playerY,
      worldMouseX - this.playerX,
    );

    this.iFrames = Math.max(0, this.iFrames - dt);
    this.tank.alpha =
      this.iFrames > 0 ? 0.55 + 0.45 * Math.sin(this.timeSec * 30) : 1;
  }

  private updateShooting(dt: number): void {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (!this.input.mouseDown || this.fireCooldown > 0) return;

    const cfg = this.fireConfig;
    const interval = cfg.fireInterval / this.stats.fireRateMult;
    this.fireCooldown = interval;
    const damage = cfg.projectileDamage * this.stats.damageMult;

    if (cfg.behavior === 'laser') {
      this.fireLaser(damage);
      return;
    }

    const count =
      cfg.behavior === 'spin' ? cfg.projectileCount : cfg.projectileCount;
    const base = this.turretAngle;
    for (let i = 0; i < count; i++) {
      let angle = base;
      if (cfg.behavior === 'spin') {
        angle = (i / count) * Math.PI * 2;
      } else if (count > 1) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        angle = base + t * cfg.spreadAngle;
      }
      this.spawnProjectile(
        this.playerX + Math.cos(angle) * 28,
        this.playerY + Math.sin(angle) * 28,
        Math.cos(angle) * cfg.projectileSpeed,
        Math.sin(angle) * cfg.projectileSpeed,
        cfg.projectileRadius,
        damage,
        cfg.pierce,
        cfg.behavior === 'wave' ? 'wave' : 'bullet',
        cfg.behavior === 'wave' ? 0.9 : 1.6,
      );
    }
  }

  private fireLaser(damage: number): void {
    const cfg = this.fireConfig;
    const len = cfg.laserLength;
    const steps = Math.ceil(len / 18);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = this.playerX + Math.cos(this.turretAngle) * len * t;
      const y = this.playerY + Math.sin(this.turretAngle) * len * t;
      this.spawnProjectile(
        x,
        y,
        0,
        0,
        cfg.projectileRadius,
        damage,
        99,
        'laser',
        0.05,
      );
    }
  }

  private spawnProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    pierce: number,
    kind: Projectile['kind'],
    life: number,
  ): void {
    const p = this.projectiles.find((q) => !q.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.radius = radius;
    p.damage = damage;
    p.pierceLeft = pierce;
    p.life = life;
    p.kind = kind;
    p.hitIds.clear();
    p.gfx.clear();
    const color =
      kind === 'laser'
        ? COLORS.laser
        : kind === 'wave'
          ? COLORS.wave
          : COLORS.bullet;
    const outline =
      kind === 'laser'
        ? 0x3ab8d4
        : kind === 'wave'
          ? 0x8a6ad4
          : COLORS.bulletOutline;
    p.gfx.circle(0, 0, radius);
    p.gfx.fill({ color });
    p.gfx.stroke({ width: 2, color: outline });
    p.gfx.visible = true;
    p.gfx.alpha = kind === 'laser' ? 0.85 : 1;
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.gfx.position.set(p.x, p.y);

      if (p.life <= 0 || Math.hypot(p.x, p.y) > ARENA_RADIUS + 200) {
        p.active = false;
        p.gfx.visible = false;
        continue;
      }

      for (const e of this.enemies) {
        if (!e.active || p.hitIds.has(e.id)) continue;
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d > p.radius + e.radius) continue;
        p.hitIds.add(e.id);
        e.hp -= p.damage;
        if (e.hp <= 0) this.killEnemy(e);
        if (p.kind !== 'laser') {
          if (p.pierceLeft <= 0) {
            p.active = false;
            p.gfx.visible = false;
            break;
          }
          p.pierceLeft -= 1;
        }
      }
    }
  }

  private updateSpawns(dt: number): void {
    const density = 0.55 + this.timeSec * 0.035;
    this.spawnAcc += dt * density;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.activeEnemyCount() >= MAX_ENEMIES - 5) break;
      this.spawnEnemy(this.pickEnemyKind(), false);
    }
  }

  private pickEnemyKind(): EnemyKind {
    const t = this.timeSec;
    const roll = Math.random();
    if (t > 180 && roll < 0.12) return 'exploder';
    if (t > 90 && roll < 0.2) return 'spitter';
    if (t > 45 && roll < 0.28) return 'brute';
    if (roll < 0.45) return 'swarm';
    return 'chaser';
  }

  private enemyDef(kind: EnemyKind) {
    switch (kind) {
      case 'swarm':
        return {
          hp: 8,
          speed: 160,
          radius: 12,
          contactDamage: 6,
          xp: 1,
          color: 0xffd6a5,
          outline: 0xe09b4a,
        };
      case 'brute':
        return {
          hp: 55,
          speed: 70,
          radius: 26,
          contactDamage: 16,
          xp: 4,
          color: 0xbdb2ff,
          outline: 0x7b6fd4,
        };
      case 'spitter':
        return {
          hp: 22,
          speed: 90,
          radius: 18,
          contactDamage: 8,
          xp: 3,
          color: 0xcaffbf,
          outline: 0x5aaa4a,
        };
      case 'exploder':
        return {
          hp: 18,
          speed: 140,
          radius: 15,
          contactDamage: 22,
          xp: 3,
          color: 0xffadad,
          outline: 0xd45d5d,
        };
      case 'bossA':
        return {
          hp: 900,
          speed: 55,
          radius: 48,
          contactDamage: 22,
          xp: 40,
          color: 0xff85a1,
          outline: 0xb8325a,
        };
      case 'bossB':
        return {
          hp: 1600,
          speed: 65,
          radius: 56,
          contactDamage: 28,
          xp: 70,
          color: 0x9bf6ff,
          outline: 0x2a8fa0,
        };
      case 'chaser':
      default:
        return {
          hp: 16,
          speed: 110,
          radius: 16,
          contactDamage: 10,
          xp: 2,
          color: 0xff9aa2,
          outline: 0xd45d7a,
        };
    }
  }

  private spawnEnemy(kind: EnemyKind, nearEdge: boolean): void {
    const slot = this.enemies.find((e) => !e.active);
    if (!slot) return;
    const angle = Math.random() * Math.PI * 2;
    const margin = nearEdge ? 380 : 420 + Math.random() * 120;
    const x = this.playerX + Math.cos(angle) * margin;
    const y = this.playerY + Math.sin(angle) * margin;
    const clamped = this.clampToArena(x, y, 40);
    const def = this.enemyDef(kind);
    const scale = 1 + this.timeSec / 400;
    slot.active = true;
    slot.id = nextEnemyId++;
    slot.kind = kind;
    slot.x = clamped.x;
    slot.y = clamped.y;
    slot.maxHp = def.hp * scale;
    slot.hp = slot.maxHp;
    slot.speed = def.speed;
    slot.radius = def.radius;
    slot.contactDamage = def.contactDamage;
    slot.xp = def.xp;
    slot.shootCooldown = 1.5;
    slot.phaseTimer = 0;
    slot.gfx.clear();
    slot.gfx.circle(0, 0, def.radius);
    slot.gfx.fill({ color: def.color });
    slot.gfx.stroke({
      width: kind.startsWith('boss') ? 5 : 3,
      color: def.outline,
    });
    slot.gfx.circle(-def.radius * 0.3, -def.radius * 0.3, def.radius * 0.25);
    slot.gfx.fill({ color: 0xffffff, alpha: 0.45 });
    slot.gfx.visible = true;
    slot.gfx.position.set(slot.x, slot.y);
  }

  private clampToArena(
    x: number,
    y: number,
    pad: number,
  ): { x: number; y: number } {
    const d = Math.hypot(x, y);
    const max = ARENA_RADIUS - pad;
    if (d <= max) return { x, y };
    const s = max / d;
    return { x: x * s, y: y * s };
  }

  private activeEnemyCount(): number {
    return this.enemies.reduce((n, e) => n + (e.active ? 1 : 0), 0);
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      if (!e.active) continue;

      const dx = this.playerX - e.x;
      const dy = this.playerY - e.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (e.kind === 'bossA') {
        this.updateBossA(e, dt, dx, dy, dist);
      } else if (e.kind === 'bossB') {
        this.updateBossB(e, dt, dx, dy, dist);
      } else if (e.kind === 'spitter') {
        if (dist > 260) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        } else if (dist < 180) {
          e.x -= (dx / dist) * e.speed * 0.7 * dt;
          e.y -= (dy / dist) * e.speed * 0.7 * dt;
        }
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 1.8;
          const sp = 240;
          this.spawnHostileShot(
            e.x,
            e.y,
            (dx / dist) * sp,
            (dy / dist) * sp,
            10,
          );
        }
      } else {
        let speed = e.speed;
        if (e.kind === 'exploder' && dist < 120) speed *= 1.5;
        e.x += (dx / dist) * speed * dt;
        e.y += (dy / dist) * speed * dt;
      }

      const clamped = this.clampToArena(e.x, e.y, e.radius);
      e.x = clamped.x;
      e.y = clamped.y;

      const sepDx = e.x - this.playerX;
      const sepDy = e.y - this.playerY;
      const sepDist = Math.hypot(sepDx, sepDy);
      const minSep = e.radius + PLAYER_HIT_RADIUS;

      // Damage while overlapping / touching — before we push them off the sprite.
      if (sepDist <= minSep && this.iFrames <= 0) {
        this.hurtPlayer(e.contactDamage);
        if (e.kind === 'exploder') {
          e.gfx.position.set(e.x, e.y);
          this.killEnemy(e);
          continue;
        }
      }

      if (sepDist < minSep) {
        if (sepDist < 0.001) {
          const a = Math.random() * Math.PI * 2;
          e.x = this.playerX + Math.cos(a) * minSep;
          e.y = this.playerY + Math.sin(a) * minSep;
        } else {
          const s = minSep / sepDist;
          e.x = this.playerX + sepDx * s;
          e.y = this.playerY + sepDy * s;
        }
        const reclamped = this.clampToArena(e.x, e.y, e.radius);
        e.x = reclamped.x;
        e.y = reclamped.y;
      }

      e.gfx.position.set(e.x, e.y);
    }

    // Enemy spit: reuse projectiles that are "hostile" — simple approach:
    // check projectiles near player that weren't fired by player recently is messy.
    // Instead handle spitter shots as instant damage ray or dedicated hostile pool.
  }

  private updateBossA(
    e: Enemy,
    dt: number,
    dx: number,
    dy: number,
    dist: number,
  ): void {
    e.phaseTimer += dt;
    e.x += (dx / dist) * e.speed * dt;
    e.y += (dy / dist) * e.speed * dt;
    e.shootCooldown -= dt;
    if (e.shootCooldown <= 0) {
      e.shootCooldown = 1.2;
      // Ring telegraph: spawn outward wave of harm zones as slow bubbles toward player fan
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.timeSec;
        this.spawnHostileShot(
          e.x,
          e.y,
          Math.cos(a) * 180,
          Math.sin(a) * 180,
          12,
        );
      }
    }
  }

  private updateBossB(
    e: Enemy,
    dt: number,
    dx: number,
    dy: number,
    dist: number,
  ): void {
    e.phaseTimer += dt;
    const orbit = Math.sin(e.phaseTimer * 1.5) > 0 ? 1 : -1;
    const tx = -dy / dist;
    const ty = dx / dist;
    e.x += (dx / dist) * e.speed * 0.5 * dt + tx * e.speed * orbit * dt;
    e.y += (dy / dist) * e.speed * 0.5 * dt + ty * e.speed * orbit * dt;
    e.shootCooldown -= dt;
    if (e.shootCooldown <= 0) {
      e.shootCooldown = 0.7;
      for (let i = -2; i <= 2; i++) {
        const base = Math.atan2(dy, dx) + i * 0.18;
        this.spawnHostileShot(
          e.x,
          e.y,
          Math.cos(base) * 280,
          Math.sin(base) * 280,
          10,
        );
      }
    }
  }

  private hostileShots: Array<{
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    gfx: Graphics;
  }> = [];

  private ensureHostilePool(): void {
    if (this.hostileShots.length) return;
    for (let i = 0; i < 120; i++) {
      const gfx = createProjectileGfx(8, 0xff6b6b, 0xb83232);
      gfx.visible = false;
      gfx.zIndex = Z_PROJECTILE;
      this.entityLayer.addChild(gfx);
      this.hostileShots.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        gfx,
      });
    }
  }

  private spawnHostileShot(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
  ): void {
    this.ensureHostilePool();
    const slot = this.hostileShots.find((h) => !h.active);
    if (!slot) return;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.life = 3;
    (slot as { damage?: number }).damage = damage;
    slot.gfx.visible = true;
    slot.gfx.position.set(x, y);
  }

  private hurtPlayer(amount: number): void {
    if (this.iFrames > 0 || this.dead) return;
    this.stats.hp -= amount;
    this.iFrames = 0.7;
  }

  private killEnemy(e: Enemy): void {
    e.active = false;
    e.gfx.visible = false;
    this.kills += 1;
    this.spawnGem(e.x, e.y, e.xp);
    if (e.kind === 'bossA') this.milestonesReached.add('boss_a');
    if (e.kind === 'bossB') this.milestonesReached.add('boss_b');
  }

  private spawnGem(x: number, y: number, value: number): void {
    const g = this.gems.find((q) => !q.active);
    if (!g) {
      this.gainXp(value);
      return;
    }
    g.active = true;
    g.x = x;
    g.y = y;
    g.value = value;
    g.gfx.visible = true;
    g.gfx.position.set(x, y);
  }

  private updateGems(dt: number): void {
    // Also tick hostile shots here
    for (const h of this.hostileShots) {
      if (!h.active) continue;
      h.life -= dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.gfx.position.set(h.x, h.y);
      if (h.life <= 0) {
        h.active = false;
        h.gfx.visible = false;
        continue;
      }
      if (
        Math.hypot(h.x - this.playerX, h.y - this.playerY) < PLAYER_HIT_RADIUS
      ) {
        const dmg = (h as { damage?: number }).damage ?? 10;
        this.hurtPlayer(dmg);
        h.active = false;
        h.gfx.visible = false;
      }
    }

    for (const g of this.gems) {
      if (!g.active) continue;
      const dx = this.playerX - g.x;
      const dy = this.playerY - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.stats.pickupRadius) {
        const pull = 280 * dt;
        g.x += (dx / (dist || 1)) * pull;
        g.y += (dy / (dist || 1)) * pull;
      }
      g.gfx.position.set(g.x, g.y);
      if (dist < 24) {
        g.active = false;
        g.gfx.visible = false;
        this.gainXp(g.value);
      }
    }
  }

  private gainXp(amount: number): void {
    this.stats.xp += amount;
    while (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level += 1;
      this.stats.xpToNext = xpForLevel(this.stats.level);
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp(): void {
    const shuffled = [...STAT_POOL].sort(() => Math.random() - 0.5);
    this.levelUpOptions = shuffled.slice(0, 3).map((s) => ({ ...s }));
    this.levelUpPending = true;
    this.paused = true;
    this.onEvent({ type: 'levelUp', options: this.levelUpOptions });
    this.emitHud();
  }

  private syncCamera(): void {
    this.tank.position.set(this.playerX, this.playerY);
    this.tank.hull.rotation = this.hullAngle;
    this.tank.turret.rotation = this.turretAngle;
    this.world.position.set(
      this.viewW / 2 - this.playerX,
      this.viewH / 2 - this.playerY,
    );
  }

  private emitHud(): void {
    const snapshot: GameHudSnapshot = {
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      level: this.stats.level,
      xp: this.stats.xp,
      xpToNext: this.stats.xpToNext,
      timeSec: this.timeSec,
      kills: this.kills,
      paused: this.paused,
      dead: this.dead,
      levelUpPending: this.levelUpPending,
      levelUpOptions: this.levelUpOptions,
    };
    this.onEvent({ type: 'hud', snapshot });
  }
}
