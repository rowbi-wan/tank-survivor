import { Injectable, signal } from '@angular/core';
import { scrapForRun } from './economy';
import {
  STARTER_WEAPON_ID,
  WEAPON_NODES,
  getPathToNode,
  getWeaponNode,
  isLegalEquip,
} from './weapon-tree';

const SAVE_KEY = 'tank-survivors-meta-v1';

export interface MetaSave {
  currency: number;
  unlockedNodeIds: string[];
  equippedLeafId: string;
  bestTimeSec: number;
  milestones: string[];
}

function defaultSave(): MetaSave {
  return {
    currency: 0,
    unlockedNodeIds: [STARTER_WEAPON_ID],
    equippedLeafId: STARTER_WEAPON_ID,
    bestTimeSec: 0,
    milestones: [],
  };
}

@Injectable({ providedIn: 'root' })
export class MetaSaveService {
  readonly save = signal<MetaSave>(this.load());

  private load(): MetaSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<MetaSave>;
      const base = defaultSave();
      return {
        ...base,
        ...parsed,
        unlockedNodeIds: parsed.unlockedNodeIds?.length
          ? parsed.unlockedNodeIds
          : base.unlockedNodeIds,
        equippedLeafId: parsed.equippedLeafId ?? base.equippedLeafId,
        milestones: parsed.milestones ?? [],
      };
    } catch {
      return defaultSave();
    }
  }

  private persist(next: MetaSave): void {
    this.save.set(next);
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  }

  equip(nodeId: string): boolean {
    const s = this.save();
    const unlocked = new Set(s.unlockedNodeIds);
    if (!isLegalEquip(nodeId, unlocked)) return false;
    this.persist({ ...s, equippedLeafId: nodeId });
    return true;
  }

  canUnlock(nodeId: string): { ok: boolean; reason?: string } {
    const s = this.save();
    const node = getWeaponNode(nodeId);
    if (!node) return { ok: false, reason: 'Unknown node' };
    if (s.unlockedNodeIds.includes(nodeId)) {
      return { ok: false, reason: 'Already unlocked' };
    }
    if (node.parentId && !s.unlockedNodeIds.includes(node.parentId)) {
      return { ok: false, reason: 'Unlock parent first' };
    }
    if (node.milestoneGate && !s.milestones.includes(node.milestoneGate)) {
      return { ok: false, reason: `Need milestone: ${node.milestoneGate}` };
    }
    if (s.currency < node.cost) {
      return { ok: false, reason: 'Not enough scrap' };
    }
    return { ok: true };
  }

  unlock(nodeId: string): boolean {
    const check = this.canUnlock(nodeId);
    if (!check.ok) return false;
    const s = this.save();
    const node = getWeaponNode(nodeId)!;
    this.persist({
      ...s,
      currency: s.currency - node.cost,
      unlockedNodeIds: [...s.unlockedNodeIds, nodeId],
    });
    return true;
  }

  applyRunResult(input: {
    timeSec: number;
    kills: number;
    milestonesReached: string[];
  }): { currencyEarned: number } {
    const s = this.save();
    const currencyEarned = scrapForRun(input.timeSec, input.kills);
    const milestones = Array.from(
      new Set([...s.milestones, ...input.milestonesReached]),
    );
    this.persist({
      ...s,
      currency: s.currency + currencyEarned,
      bestTimeSec: Math.max(s.bestTimeSec, input.timeSec),
      milestones,
    });
    return { currencyEarned };
  }

  equippedPathIds(): string[] {
    return getPathToNode(this.save().equippedLeafId).map((n) => n.id);
  }

  allNodes() {
    return WEAPON_NODES;
  }
}
