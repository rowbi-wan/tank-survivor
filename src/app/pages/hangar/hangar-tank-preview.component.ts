import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { Application } from 'pixi.js';
import { createTankGraphics, type TankView } from '../../game/core/graphics';

@Component({
  selector: 'app-hangar-tank-preview',
  standalone: true,
  template: `<div class="preview" #host></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .preview {
        width: 100%;
        height: 100%;
      }
      .preview canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
      }
    `,
  ],
})
export class HangarTankPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  private readonly zone = inject(NgZone);
  private app: Application | null = null;
  private tank: TankView | null = null;
  private raf = 0;
  private running = false;
  private t = 0;

  async ngAfterViewInit(): Promise<void> {
    const host = this.hostRef.nativeElement;
    const app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    host.appendChild(app.canvas);
    this.app = app;

    const tank = createTankGraphics();
    tank.scale.set(2.6);
    app.stage.addChild(tank);
    this.tank = tank;

    const layout = () => {
      tank.position.set(app.screen.width / 2, app.screen.height / 2 + 8);
    };
    layout();
    app.renderer.on('resize', layout);

    this.running = true;
    this.zone.runOutsideAngular(() => {
      const frame = () => {
        if (!this.running || !this.tank) return;
        this.t += 0.016;
        this.tank.turret.rotation = Math.sin(this.t * 0.7) * 0.35;
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  ngOnDestroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.tank = null;
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
