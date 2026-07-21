import { DecimalPipe } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameHostComponent } from '../../game/game-host.component';
import type {
  GameHudSnapshot,
  RunResult,
  StatUpgradeOption,
} from '../../game/core/types';
import { MetaSaveService } from '../../meta/meta-save.service';

@Component({
  selector: 'app-run-page',
  standalone: true,
  imports: [GameHostComponent, RouterLink, DecimalPipe],
  template: `
    <div class="run">
      <app-game-host
        (hud)="onHud($event)"
        (levelUp)="onLevelUp($event)"
        (runEnd)="onRunEnd($event)"
      />

      @if (hud(); as h) {
        <div class="hud">
          <div class="bar">
            <span>HP {{ h.hp | number: '1.0-0' }} / {{ h.maxHp }}</span>
            <span>Lv {{ h.level }}</span>
            <span>{{ formatTime(h.timeSec) }}</span>
            <span>Kills {{ h.kills }}</span>
            <span class="scrap-c">C {{ h.scrap.circuit }}</span>
            <span class="scrap-p">P {{ h.scrap.plating }}</span>
            <span class="scrap-k">K {{ h.scrap.core }}</span>
          </div>
          <div class="xp">
            <div
              class="xp-fill"
              [style.width.%]="(h.xp / h.xpToNext) * 100"
            ></div>
          </div>
        </div>
      }

      @if (levelOptions(); as opts) {
        @if (opts.length) {
          <div class="modal">
            <div class="modal-card surface-panel">
              <h2>Level up!</h2>
              <p>Pick an upgrade</p>
              <div class="choices">
                @for (opt of opts; track opt.id) {
                  <button type="button" class="choice" (click)="pick(opt)">
                    <strong>{{ opt.label }}</strong>
                    <span>{{ opt.description }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        }
      }

      @if (summary(); as sum) {
        <div class="modal">
          <div class="modal-card surface-panel">
            <h2>Wrecked!</h2>
            <ul>
              <li>Survived {{ formatTime(sum.timeSec) }}</li>
              <li>Kills {{ sum.kills }}</li>
              <li>Level {{ sum.level }}</li>
              <li>
                Scrap +C{{ sum.scrapEarned.circuit }} · P{{
                  sum.scrapEarned.plating
                }}
                · K{{ sum.scrapEarned.core }}
              </li>
            </ul>
            <div class="actions">
              <a routerLink="/hangar" class="btn primary">Hangar</a>
              <button type="button" class="btn" (click)="retry()">Retry</button>
              <a routerLink="/" class="btn ghost">Home</a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .run {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #b8e4ff;
      }
      app-game-host {
        position: absolute;
        inset: 0;
      }
      .hud {
        position: absolute;
        left: 1rem;
        right: 1rem;
        top: 1rem;
        pointer-events: none;
        z-index: 2;
      }
      .bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        font-family: 'Fredoka', sans-serif;
        font-weight: 600;
        color: var(--ink);
        text-shadow: 0 1px 0 #fff;
      }
      .scrap-c {
        color: #1a6a7a;
      }
      .scrap-p {
        color: #4a5560;
      }
      .scrap-k {
        color: #a85a10;
      }
      .xp {
        margin-top: 0.5rem;
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.55);
        border: 2px solid var(--ink);
        overflow: hidden;
      }
      .xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #7dffb3, #5ad4a0);
      }
      .modal {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(58, 47, 69, 0.35);
        z-index: 5;
        padding: 1rem;
      }
      .modal-card {
        width: min(520px, 100%);
      }
      .modal-card h2 {
        font-family: 'Fredoka', sans-serif;
        margin: 0 0 0.35rem;
        color: var(--pink-deep);
      }
      .choices {
        display: grid;
        gap: 0.6rem;
        margin-top: 1rem;
      }
      .choice {
        text-align: left;
        border: 3px solid var(--ink);
        border-radius: 1rem;
        padding: 0.85rem 1rem;
        background: #fff;
        cursor: pointer;
        display: grid;
        gap: 0.2rem;
        font: inherit;
      }
      .choice:hover {
        background: #ffe8ef;
      }
      .choice strong {
        font-family: 'Fredoka', sans-serif;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      ul {
        margin: 0.75rem 0 0;
        padding-left: 1.2rem;
      }
    `,
  ],
})
export class RunPageComponent {
  private readonly meta = inject(MetaSaveService);
  private readonly router = inject(Router);
  private readonly host = viewChild(GameHostComponent);

  readonly hud = signal<GameHudSnapshot | null>(null);
  readonly levelOptions = signal<StatUpgradeOption[]>([]);
  readonly summary = signal<RunResult | null>(null);
  private settled = false;

  onHud(snapshot: GameHudSnapshot): void {
    this.hud.set(snapshot);
    if (!snapshot.levelUpPending) {
      this.levelOptions.set([]);
    }
  }

  onLevelUp(options: StatUpgradeOption[]): void {
    this.levelOptions.set(options);
  }

  onRunEnd(result: RunResult): void {
    if (this.settled) return;
    this.settled = true;
    const { scrapEarned } = this.meta.applyRunResult({
      timeSec: result.timeSec,
      scrapEarned: result.scrapEarned,
      milestonesReached: result.milestonesReached,
    });
    this.summary.set({ ...result, scrapEarned });
    this.levelOptions.set([]);
  }

  pick(opt: StatUpgradeOption): void {
    this.host()?.chooseUpgrade(opt.id);
    this.levelOptions.set([]);
  }

  retry(): void {
    void this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() => {
        void this.router.navigateByUrl('/run');
      });
  }

  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
