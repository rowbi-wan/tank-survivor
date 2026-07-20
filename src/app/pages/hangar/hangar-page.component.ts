import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetaSaveService } from '../../meta/meta-save.service';
import {
  WEAPON_NODES,
  getPathToNode,
  type WeaponNode,
} from '../../meta/weapon-tree';

@Component({
  selector: 'app-hangar-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="page">
      <header class="top">
        <a routerLink="/" class="btn ghost">← Home</a>
        <h1>Hangar</h1>
        <div class="scrap">Scrap: {{ meta.save().currency }}</div>
      </header>

      <p class="blurb">
        Unlock nodes with scrap. Equip one leaf path for your next run —
        siblings can all be unlocked; only the equipped branch is active.
      </p>

      <div class="layout">
        <section class="tree">
          @for (node of nodes; track node.id) {
            <article
              class="node"
              [class.unlocked]="isUnlocked(node.id)"
              [class.equipped]="isEquippedPath(node.id)"
              [class.locked]="!isUnlocked(node.id)"
            >
              <div class="node-head">
                <h2>{{ node.name }}</h2>
                <span class="tier">{{ depthLabel(node) }}</span>
              </div>
              <p>{{ node.description }}</p>
              @if (node.parentId) {
                <p class="meta">Requires: {{ parentName(node) }}</p>
              }
              @if (node.milestoneGate) {
                <p class="meta gate">
                  Gate: {{ gateLabel(node.milestoneGate) }}
                </p>
              }
              <div class="row">
                @if (!isUnlocked(node.id)) {
                  <button
                    class="btn small"
                    type="button"
                    [disabled]="!canUnlock(node.id)"
                    (click)="unlock(node.id)"
                  >
                    Unlock ({{ node.cost }})
                  </button>
                  @if (unlockHint(node.id); as hint) {
                    <span class="hint">{{ hint }}</span>
                  }
                } @else {
                  <button
                    class="btn small primary"
                    type="button"
                    [disabled]="meta.save().equippedLeafId === node.id"
                    (click)="equip(node.id)"
                  >
                    {{
                      meta.save().equippedLeafId === node.id
                        ? 'Equipped'
                        : 'Equip path'
                    }}
                  </button>
                }
              </div>
            </article>
          }
        </section>

        <aside class="summary bubble-panel">
          <h2>Active loadout</h2>
          <ol>
            @for (id of equippedPath(); track id) {
              <li>{{ nodeName(id) }}</li>
            }
          </ol>
          <p class="best">
            Best time: {{ formatTime(meta.save().bestTimeSec) }}
          </p>
          <p class="milestones">
            Milestones:
            @if (meta.save().milestones.length === 0) {
              none yet
            } @else {
              {{ meta.save().milestones.join(', ') }}
            }
          </p>
          <a routerLink="/run" class="btn primary">Deploy</a>
        </aside>
      </div>
    </main>
  `,
  styles: [
    `
      .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      .top {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      h1 {
        font-family: 'Fredoka', sans-serif;
        color: var(--pink-deep);
        margin: 0;
        flex: 1;
      }
      .scrap {
        font-weight: 700;
        background: var(--cream);
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        border: 3px solid var(--ink);
      }
      .blurb {
        color: var(--ink-soft);
        max-width: 40rem;
      }
      .layout {
        display: grid;
        grid-template-columns: 1fr minmax(220px, 280px);
        gap: 1.25rem;
      }
      @media (max-width: 800px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
      .tree {
        display: grid;
        gap: 0.75rem;
      }
      .node {
        background: rgba(255, 255, 255, 0.72);
        border: 3px solid var(--ink);
        border-radius: 1.25rem;
        padding: 1rem 1.1rem;
      }
      .node.equipped {
        border-color: var(--pink-deep);
        box-shadow: 0 0 0 3px rgba(212, 93, 122, 0.25);
      }
      .node.locked {
        opacity: 0.72;
      }
      .node-head {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        align-items: baseline;
      }
      .node h2 {
        font-family: 'Fredoka', sans-serif;
        margin: 0;
        font-size: 1.2rem;
      }
      .tier {
        font-size: 0.8rem;
        color: var(--ink-soft);
      }
      .meta {
        font-size: 0.85rem;
        color: var(--ink-soft);
        margin: 0.25rem 0;
      }
      .gate {
        color: var(--teal-deep);
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-top: 0.6rem;
      }
      .hint {
        font-size: 0.8rem;
        color: #b83232;
      }
      .summary h2 {
        font-family: 'Fredoka', sans-serif;
        margin-top: 0;
      }
      .summary ol {
        padding-left: 1.2rem;
      }
      .summary .btn {
        margin-top: 0.75rem;
        display: inline-flex;
      }
    `,
  ],
})
export class HangarPageComponent {
  readonly meta = inject(MetaSaveService);
  readonly nodes = WEAPON_NODES;

  readonly equippedPath = computed(() => this.meta.equippedPathIds());

  isUnlocked(id: string): boolean {
    return this.meta.save().unlockedNodeIds.includes(id);
  }

  isEquippedPath(id: string): boolean {
    return this.equippedPath().includes(id);
  }

  canUnlock(id: string): boolean {
    return this.meta.canUnlock(id).ok;
  }

  unlockHint(id: string): string | null {
    const r = this.meta.canUnlock(id);
    if (r.ok || this.isUnlocked(id)) return null;
    return r.reason ?? null;
  }

  unlock(id: string): void {
    this.meta.unlock(id);
  }

  equip(id: string): void {
    this.meta.equip(id);
  }

  parentName(node: WeaponNode): string {
    return WEAPON_NODES.find((n) => n.id === node.parentId)?.name ?? '—';
  }

  nodeName(id: string): string {
    return WEAPON_NODES.find((n) => n.id === id)?.name ?? id;
  }

  depthLabel(node: WeaponNode): string {
    return `Depth ${getPathToNode(node.id).length}`;
  }

  gateLabel(gate: string): string {
    const map: Record<string, string> = {
      survive_5: 'Survive 5:00',
      survive_10: 'Survive 10:00',
      boss_a: 'Defeat Boss A',
      boss_b: 'Defeat Boss B',
    };
    return map[gate] ?? gate;
  }

  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
