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
import { MetaSaveService } from '../meta/meta-save.service';
import { resolveFireConfig } from '../meta/weapon-tree';
import { FIXED_DT, COLORS } from './core/constants';
import { createAimReticle } from './core/graphics';
import { GameSession } from './core/game-session';
import { InputState } from './core/input';
import type {
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
export class GameHostComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  readonly hud = output<GameHudSnapshot>();
  readonly levelUp = output<StatUpgradeOption[]>();
  readonly runEnd = output<RunResult>();

  private readonly meta = inject(MetaSaveService);
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
    const app = new Application();
    await app.init({
      resizeTo: host,
      background: COLORS.skyTop,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    host.appendChild(app.canvas);
    this.app = app;

    const input = new InputState();
    this.detachInput = input.attach(host);

    const fire = resolveFireConfig(this.meta.save().equippedLeafId);
    const session = new GameSession(input, fire, (e) => this.handleEvent(e));
    session.setViewSize(app.screen.width, app.screen.height);
    app.stage.addChild(session.world);
    this.session = session;

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

  private handleEvent(e: GameEvent): void {
    this.zone.run(() => {
      if (e.type === 'hud') this.hud.emit(e.snapshot);
      if (e.type === 'levelUp') this.levelUp.emit(e.options);
      if (e.type === 'runEnd') this.runEnd.emit(e.result);
    });
  }

  ngOnDestroy(): void {
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
