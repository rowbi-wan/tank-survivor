import { Component, inject } from '@angular/core';
import { MetaSaveService } from '../meta/meta-save.service';
import type { EnemyKind } from '../game/core/types';
import { WEAPON_NODES } from '../meta/weapon-tree';
import { DebugMenuService } from './debug-menu.service';
import type { RunDebugApi } from './run-debug-api';

const ENEMY_KINDS: EnemyKind[] = [
  'chaser',
  'swarm',
  'brute',
  'spitter',
  'exploder',
  'bossA',
  'bossB',
];

@Component({
  selector: 'app-debug-menu',
  standalone: true,
  template: `
    @if (debug.enabled && debug.open()) {
      <aside class="panel surface-panel" aria-label="Debug menu">
        <header class="head">
          <h2>Debug</h2>
          <button type="button" class="btn small" (click)="debug.close()">
            Close
          </button>
        </header>
        <p class="hint">\` toggle · Esc close · dev only</p>

        @if (debug.onRun() && debug.runApi(); as api) {
          <section>
            <h3>Run</h3>
            <p class="meta-line">
              Weapon: {{ weaponLabel(api.getCurrentWeaponId()) }}
            </p>
            <div class="row">
              <label class="spawn">
                Weapon
                <select
                  #weaponSelect
                  [value]="api.getCurrentWeaponId()"
                  (change)="selectWeapon(api, weaponSelect.value)"
                >
                  @for (w of weapons; track w.id) {
                    <option [value]="w.id">{{ w.name }}</option>
                  }
                </select>
              </label>
            </div>
            <div class="row">
              <button
                type="button"
                class="btn small"
                [class.primary]="api.isGodMode()"
                (click)="toggleGod(api)"
              >
                God {{ api.isGodMode() ? 'ON' : 'OFF' }}
              </button>
              <button type="button" class="btn small" (click)="api.healFull()">
                Heal full
              </button>
            </div>
            <div class="row">
              <button type="button" class="btn small" (click)="api.addTime(30)">
                +30s
              </button>
              <button type="button" class="btn small" (click)="api.addTime(60)">
                +60s
              </button>
              <button
                type="button"
                class="btn small"
                (click)="api.setTime(4 * 60 + 50)"
              >
                → 4:50
              </button>
              <button
                type="button"
                class="btn small"
                (click)="api.setTime(9 * 60 + 50)"
              >
                → 9:50
              </button>
            </div>
            <div class="row">
              <label class="spawn">
                Spawn
                <select #kindSelect>
                  @for (k of kinds; track k) {
                    <option [value]="k">{{ k }}</option>
                  }
                </select>
              </label>
              <button
                type="button"
                class="btn small primary"
                (click)="spawn(api, kindSelect.value)"
              >
                Spawn
              </button>
              <button
                type="button"
                class="btn small"
                (click)="api.clearEnemies()"
              >
                Clear foes
              </button>
            </div>
          </section>
        } @else {
          <section>
            <h3>Meta</h3>
            <p class="meta-line">Scrap: {{ meta.save().currency }}</p>
            <div class="row">
              <button
                type="button"
                class="btn small"
                (click)="meta.debugAddScrap(100)"
              >
                +100 scrap
              </button>
              <button
                type="button"
                class="btn small"
                (click)="meta.debugAddScrap(1000)"
              >
                +1000 scrap
              </button>
            </div>
            <div class="row">
              <button
                type="button"
                class="btn small"
                (click)="meta.debugUnlockAll()"
              >
                Unlock all
              </button>
              <button
                type="button"
                class="btn small"
                (click)="meta.debugGrantMilestones()"
              >
                Grant milestones
              </button>
            </div>
            @if (!debug.confirmReset()) {
              <button
                type="button"
                class="btn small danger"
                (click)="debug.confirmReset.set(true)"
              >
                Reset save…
              </button>
            } @else {
              <div class="confirm">
                <span>Wipe meta save?</span>
                <button
                  type="button"
                  class="btn small danger"
                  (click)="resetSave()"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  class="btn small"
                  (click)="debug.confirmReset.set(false)"
                >
                  Cancel
                </button>
              </div>
            }
          </section>
        }
      </aside>
    }
  `,
  styles: [
    `
      .panel {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        width: min(320px, calc(100vw - 2rem));
        max-height: calc(100vh - 2rem);
        overflow: auto;
        pointer-events: auto;
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      h2 {
        font-family: 'Fredoka', sans-serif;
        margin: 0;
        color: var(--pink-deep);
        font-size: 1.25rem;
      }
      h3 {
        font-family: 'Fredoka', sans-serif;
        margin: 0.75rem 0 0.4rem;
        font-size: 0.95rem;
      }
      .hint {
        margin: 0.35rem 0 0;
        font-size: 0.75rem;
        color: var(--ink-soft);
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 0.45rem;
      }
      .meta-line {
        margin: 0 0 0.45rem;
        font-weight: 700;
      }
      .spawn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
      }
      .spawn select {
        font: inherit;
        border: 2px solid var(--ink);
        border-radius: 0.5rem;
        padding: 0.25rem 0.35rem;
      }
      .confirm {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        align-items: center;
        margin-top: 0.35rem;
        font-size: 0.9rem;
      }
      .btn.danger {
        background: #ffb4b4;
      }
      .btn.danger:hover:not(:disabled) {
        background: #f08080;
      }
    `,
  ],
})
export class DebugMenuComponent {
  readonly debug = inject(DebugMenuService);
  readonly meta = inject(MetaSaveService);
  readonly kinds = ENEMY_KINDS;
  readonly weapons = WEAPON_NODES.filter((n) => n.id !== 'cannon-base');

  spawn(api: RunDebugApi, kind: string): void {
    if ((this.kinds as string[]).includes(kind)) {
      api.spawnEnemy(kind as EnemyKind);
    }
  }

  weaponLabel(nodeId: string): string {
    return WEAPON_NODES.find((n) => n.id === nodeId)?.name ?? nodeId;
  }

  selectWeapon(api: RunDebugApi, nodeId: string): void {
    if (WEAPON_NODES.some((n) => n.id === nodeId)) {
      api.setWeapon(nodeId);
    }
  }

  toggleGod(api: RunDebugApi): void {
    api.setGodMode(!api.isGodMode());
  }

  resetSave(): void {
    this.meta.debugResetSave();
    this.debug.confirmReset.set(false);
  }
}
