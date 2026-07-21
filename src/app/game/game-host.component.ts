import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  output,
} from '@angular/core';
import { Application, Graphics } from 'pixi.js';
import { DebugMenuService } from '../debug/debug-menu.service';
import type { RunDebugApi } from '../debug/run-debug-api';
import { MetaSaveService } from '../meta/meta-save.service';
import { getMap } from '../meta/maps';
import { resolveFireConfig } from '../meta/weapon-tree';
import { FIXED_DT } from './core/constants';
import { createAimReticle } from './core/graphics';
import { GameSession } from './core/game-session';
import { InputState } from './core/input';
import type {
  EnemyKind,
  GameEvent,
  GameHudSnapshot,
  RunResult,
  StatUpgradeOption,
} from './core/types';

@Component({
  selector: 'app-game-host',
  standalone: true,
  template: `<div class="host" #host></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .host {
        width: 100%;
        height: 100%;
        touch-action: none;
        cursor: none;
      }
      .host canvas {
        cursor: none;
      }
    `,
  ],
})
export class GameHostComponent
  implements AfterViewInit, OnDestroy, RunDebugApi
{
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  readonly hud = output<GameHudSnapshot>();
  readonly levelUp = output<StatUpgradeOption[]>();
  readonly runEnd = output<RunResult>();

  private readonly meta = inject(MetaSaveService);
  private readonly debugMenu = inject(DebugMenuService);
  private readonly zone = inject(NgZone);
  private app: Application | null = null;
  private session: GameSession | null = null;
  private reticle: Graphics | null = null;
  private detachInput: (() => void) | null = null;
  private raf = 0;
  private acc = 0;
  private last = 0;
  private running = false;

  async ngAfterViewInit(): Promise<void> {
    const host = this.hostRef.nativeElement;
    const map = getMap(this.meta.save().selectedMapId);
    const app = new Application();
    await app.init({
      resizeTo: host,
      background: map.palette.skyTop,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    host.appendChild(app.canvas);
    this.app = app;

    const input = new InputState();
    this.detachInput = input.attach(host);

    const fire = resolveFireConfig(this.meta.save().equippedLeafId);
    const session = new GameSession(input, fire, map, (e) =>
      this.handleEvent(e),
    );
    session.setViewSize(app.screen.width, app.screen.height);
    app.stage.addChild(session.world);
    this.session = session;
    this.debugMenu.registerRun(this);

    const reticle = createAimReticle();
    reticle.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(reticle);
    this.reticle = reticle;

    const onResize = () => {
      session.setViewSize(app.screen.width, app.screen.height);
    };
    app.renderer.on('resize', onResize);

    this.running = true;
    this.last = performance.now();
    this.zone.runOutsideAngular(() => {
      const frame = (now: number) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        this.acc += dt;
        while (this.acc >= FIXED_DT) {
          session.update(FIXED_DT);
          this.acc -= FIXED_DT;
        }
        reticle.position.set(input.mouseX, input.mouseY);
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  chooseUpgrade(id: StatUpgradeOption['id']): void {
    this.session?.chooseUpgrade(id);
  }

  isLevelUpPending(): boolean {
    return this.session?.isLevelUpPending() ?? false;
  }

  setDebugPaused(paused: boolean): void {
    this.session?.setDebugPaused(paused);
  }

  setGodMode(on: boolean): void {
    this.session?.setGodMode(on);
  }

  isGodMode(): boolean {
    return this.session?.isGodMode() ?? false;
  }

  healFull(): void {
    this.session?.healFull();
  }

  addTime(seconds: number): void {
    this.session?.addTime(seconds);
  }

  setTime(seconds: number): void {
    this.session?.setTime(seconds);
  }

  getCurrentWeaponId(): string {
    return this.meta.save().equippedLeafId;
  }

  setWeapon(nodeId: string): void {
    if (!this.meta.debugEquipWeapon(nodeId)) return;
    this.session?.updateFireConfig(resolveFireConfig(nodeId));
  }

  spawnEnemy(kind: EnemyKind): void {
    this.session?.debugSpawnEnemy(kind);
  }

  clearEnemies(): void {
    this.session?.clearEnemies();
  }

  private handleEvent(e: GameEvent): void {
    this.zone.run(() => {
      if (e.type === 'hud') this.hud.emit(e.snapshot);
      if (e.type === 'levelUp') this.levelUp.emit(e.options);
      if (e.type === 'runEnd') this.runEnd.emit(e.result);
    });
  }

  ngOnDestroy(): void {
    this.debugMenu.unregisterRun(this);
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.detachInput?.();
    this.session?.destroy();
    this.session = null;
    this.reticle = null;
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
