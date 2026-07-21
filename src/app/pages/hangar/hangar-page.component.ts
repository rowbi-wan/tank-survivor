import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetaSaveService } from '../../meta/meta-save.service';
import {
  STARTER_WEAPON_ID,
  WEAPON_NODES,
  getChildren,
  getWeaponNode,
  type WeaponNode,
} from '../../meta/weapon-tree';
import { HangarTankPreviewComponent } from './hangar-tank-preview.component';

interface TreeView {
  node: WeaponNode;
  children: TreeView[];
}

const SLOTS = [
  { id: 'turret', label: 'Turret', live: true, position: 'top' },
  { id: 'hull', label: 'Hull', live: false, position: 'bottom' },
  { id: 'treads', label: 'Treads', live: false, position: 'left' },
  { id: 'gadget', label: 'Gadget', live: false, position: 'right' },
] as const;

function buildTree(nodeId: string): TreeView {
  const node = getWeaponNode(nodeId)!;
  return {
    node,
    children: getChildren(nodeId).map((c) => buildTree(c.id)),
  };
}

@Component({
  selector: 'app-hangar-page',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, HangarTankPreviewComponent],
  template: `
    <main class="page">
      <header class="top">
        <a routerLink="/" class="btn ghost">← Home</a>
        <h1>Hangar</h1>
        <div class="scrap">Scrap: {{ meta.save().currency }}</div>
      </header>

      <div class="bay" [class.tree-open]="turretOpen()">
        <section class="tank-panel surface-panel">
          <div class="tank-stage">
            @for (slot of slots; track slot.id) {
              <button
                type="button"
                class="slot"
                [class]="slot.position"
                [class.live]="slot.live"
                [class.active]="slot.live && turretOpen()"
                [class.disabled-slot]="!slot.live"
                [disabled]="!slot.live"
                [attr.title]="
                  slot.live ? 'Edit turret weapon tree' : 'Coming soon'
                "
                (click)="slot.live && toggleTurret()"
              >
                <span class="slot-label">{{ slot.label }}</span>
                @if (slot.live) {
                  <span class="slot-equip">{{ equippedLeafName() }}</span>
                } @else {
                  <span class="slot-soon">Coming soon</span>
                }
              </button>
            }
            <div class="tank-canvas">
              <app-hangar-tank-preview />
            </div>
          </div>

          <div class="records">
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
          </div>

          <a routerLink="/run" class="btn primary deploy">Deploy</a>
        </section>

        @if (turretOpen()) {
          <section
            class="tree-pane surface-panel"
            aria-label="Turret weapon tree"
          >
            <header class="tree-head">
              <div>
                <h2>Turret</h2>
                <p class="tree-blurb">
                  Pick a branch. Children nest under their parent — equip one
                  path for your next run.
                </p>
              </div>
              <button class="btn small" type="button" (click)="closeTurret()">
                Done
              </button>
            </header>

            <div class="tree-scroll">
              <div class="tree">
                <ul>
                  <ng-container
                    *ngTemplateOutlet="
                      treeNodeTpl;
                      context: { $implicit: weaponTree }
                    "
                  />
                </ul>
              </div>
            </div>

            @if (selectedNode(); as node) {
              <footer class="detail">
                <div class="detail-copy">
                  <h3>{{ node.name }}</h3>
                  <p>{{ node.description }}</p>
                  @if (node.parentId) {
                    <p class="meta">Requires: {{ parentName(node) }}</p>
                  }
                  @if (node.milestoneGate) {
                    <p class="meta gate">
                      Gate: {{ gateLabel(node.milestoneGate) }}
                    </p>
                  }
                  @if (!isUnlocked(node.id) && unlockHint(node.id); as hint) {
                    <p class="hint">{{ hint }}</p>
                  }
                </div>
                <div class="detail-actions">
                  @if (!isUnlocked(node.id)) {
                    <button
                      class="btn small primary"
                      type="button"
                      [disabled]="!canUnlock(node.id)"
                      (click)="unlock(node.id)"
                    >
                      Unlock ({{ node.cost }})
                    </button>
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
              </footer>
            }
          </section>
        }
      </div>
    </main>

    <ng-template #treeNodeTpl let-view>
      <li>
        <button
          type="button"
          class="node-chip"
          [class.unlocked]="isUnlocked(view.node.id)"
          [class.locked]="!isUnlocked(view.node.id)"
          [class.on-path]="isEquippedPath(view.node.id)"
          [class.selected]="selectedId() === view.node.id"
          (click)="selectNode(view.node.id)"
        >
          {{ view.node.name }}
        </button>
        @if (view.children.length) {
          <ul>
            @for (child of view.children; track child.node.id) {
              <ng-container
                *ngTemplateOutlet="treeNodeTpl; context: { $implicit: child }"
              />
            }
          </ul>
        }
      </li>
    </ng-template>
  `,
  styles: [
    `
      .page {
        max-width: 1280px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      .top {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
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
      .bay {
        display: grid;
        grid-template-columns: minmax(280px, 420px);
        gap: 1.25rem;
        justify-content: center;
        align-items: start;
      }
      .bay.tree-open {
        grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
        justify-content: stretch;
      }
      @media (max-width: 860px) {
        .bay,
        .bay.tree-open {
          grid-template-columns: 1fr;
        }
      }
      .tank-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .tank-stage {
        position: relative;
        width: min(100%, 300px);
        aspect-ratio: 1;
      }
      .tank-canvas {
        position: absolute;
        inset: 18%;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        border: 3px dashed rgba(58, 47, 69, 0.15);
        overflow: hidden;
      }
      .slot {
        position: absolute;
        z-index: 2;
        min-width: 5.5rem;
        max-width: 7rem;
        padding: 0.45rem 0.55rem;
        border-radius: 0.85rem;
        border: 3px solid var(--ink);
        background: #fff;
        font-family: 'Nunito', sans-serif;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        box-shadow: 0 4px 0 rgba(58, 47, 69, 0.08);
      }
      .slot.top {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
      }
      .slot.bottom {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
      }
      .slot.left {
        left: 0;
        top: 50%;
        transform: translateY(-50%);
      }
      .slot.right {
        right: 0;
        top: 50%;
        transform: translateY(-50%);
      }
      .slot.live {
        border-color: var(--pink-deep);
        background: #fff5f8;
      }
      .slot.live:hover {
        background: #ffe8ef;
      }
      .slot.active {
        box-shadow: 0 0 0 3px rgba(212, 93, 122, 0.3);
      }
      .slot.disabled-slot,
      .slot:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        background: #e8e4ee;
        border-color: #9a90a8;
        color: var(--ink-soft);
      }
      .slot-label {
        font-family: 'Fredoka', sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .slot-equip {
        font-size: 0.72rem;
        color: var(--pink-deep);
        font-weight: 700;
        line-height: 1.2;
      }
      .slot-soon {
        font-size: 0.68rem;
        color: var(--ink-soft);
      }
      .records {
        text-align: center;
        color: var(--ink-soft);
        font-size: 0.9rem;
      }
      .records p {
        margin: 0.2rem 0;
      }
      .deploy {
        min-width: 10rem;
      }
      .tree-pane {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        min-height: 420px;
        max-height: min(80vh, 720px);
      }
      .tree-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .tree-head h2 {
        font-family: 'Fredoka', sans-serif;
        margin: 0 0 0.25rem;
        color: var(--pink-deep);
      }
      .tree-blurb {
        margin: 0;
        color: var(--ink-soft);
        font-size: 0.9rem;
        max-width: 28rem;
      }
      .tree-scroll {
        flex: 1;
        overflow: auto;
        padding: 0.75rem 1.25rem 1.25rem;
        /* Keep chips clear of the scrollbar / clipped edges */
        scroll-padding: 1rem;
      }
      .tree {
        width: max-content;
        min-width: 100%;
        margin-inline: auto;
        box-sizing: border-box;
        padding-inline: 0.5rem;
      }
      .tree ul {
        padding-top: 1.1rem;
        position: relative;
        display: flex;
        /* safe: if wider than the pane, align start so left nodes stay scrollable */
        justify-content: safe center;
        margin: 0;
        padding-left: 0;
      }
      .tree > ul {
        padding-top: 0;
      }
      .tree li {
        list-style: none;
        text-align: center;
        position: relative;
        padding: 1.1rem 0.45rem 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .tree li::before,
      .tree li::after {
        content: '';
        position: absolute;
        top: 0;
        right: 50%;
        border-top: 3px solid rgba(58, 47, 69, 0.22);
        width: 50%;
        height: 1.1rem;
      }
      .tree li::after {
        right: auto;
        left: 50%;
        border-left: 3px solid rgba(58, 47, 69, 0.22);
      }
      .tree li:only-child::before,
      .tree li:only-child::after {
        display: none;
      }
      .tree li:only-child {
        padding-top: 0;
      }
      .tree > ul > li:only-child {
        padding-top: 0;
      }
      .tree li:first-child::before,
      .tree li:last-child::after {
        border: 0 none;
      }
      .tree li:last-child::before {
        border-right: 3px solid rgba(58, 47, 69, 0.22);
        border-radius: 0 6px 0 0;
      }
      .tree li:first-child::after {
        border-radius: 6px 0 0 0;
      }
      .node-chip {
        position: relative;
        z-index: 1;
        border: 3px solid var(--ink);
        border-radius: 999px;
        background: #fff;
        padding: 0.45rem 0.85rem;
        font-family: 'Fredoka', sans-serif;
        font-size: 0.85rem;
        cursor: pointer;
        white-space: nowrap;
        color: var(--ink);
      }
      .node-chip.locked {
        opacity: 0.7;
        background: #f0ecf5;
      }
      .node-chip.on-path {
        border-color: var(--pink-deep);
        background: #ffe8ef;
        box-shadow: 0 0 0 3px rgba(212, 93, 122, 0.2);
      }
      .node-chip.selected {
        outline: 3px solid var(--teal-deep);
        outline-offset: 2px;
      }
      .detail {
        display: flex;
        flex-wrap: wrap;
        gap: 0.85rem;
        justify-content: space-between;
        align-items: flex-end;
        border-top: 2px dashed rgba(58, 47, 69, 0.15);
        padding-top: 0.85rem;
      }
      .detail-copy h3 {
        font-family: 'Fredoka', sans-serif;
        margin: 0 0 0.25rem;
      }
      .detail-copy p {
        margin: 0.2rem 0;
        max-width: 28rem;
      }
      .meta {
        font-size: 0.85rem;
        color: var(--ink-soft);
      }
      .gate {
        color: var(--teal-deep);
      }
      .hint {
        font-size: 0.85rem;
        color: #b83232;
      }
      .detail-actions {
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class HangarPageComponent {
  readonly meta = inject(MetaSaveService);
  readonly slots = SLOTS;
  readonly weaponTree = buildTree(STARTER_WEAPON_ID);

  readonly turretOpen = signal(false);
  readonly selectedId = signal<string | null>(null);

  readonly equippedLeafName = computed(
    () => getWeaponNode(this.meta.save().equippedLeafId)?.name ?? '—',
  );

  readonly selectedNode = computed(() => {
    const id = this.selectedId();
    return id ? (getWeaponNode(id) ?? null) : null;
  });

  toggleTurret(): void {
    if (this.turretOpen()) {
      this.closeTurret();
      return;
    }
    this.turretOpen.set(true);
    this.selectedId.set(this.meta.save().equippedLeafId);
  }

  closeTurret(): void {
    this.turretOpen.set(false);
    this.selectedId.set(null);
  }

  selectNode(id: string): void {
    this.selectedId.set(id);
  }

  isUnlocked(id: string): boolean {
    return this.meta.save().unlockedNodeIds.includes(id);
  }

  isEquippedPath(id: string): boolean {
    return this.meta.equippedPathIds().includes(id);
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
