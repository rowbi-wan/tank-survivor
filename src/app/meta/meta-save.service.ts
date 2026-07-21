import { Injectable, signal } from '@angular/core';
import {
  addScrap,
  canAfford,
  emptyScrap,
  formatScrapShortage,
  subtractScrap,
  type ScrapBundle,
  type ScrapType,
} from './economy';
import {
  MAP_UNLOCK_TIME_SEC,
  MAPS,
  STARTER_MAP_ID,
  emptyBestTimes,
  isMapUnlocked,
  type MapId,
} from './maps';
import {
  STARTER_WEAPON_ID,
  WEAPON_NODES,
  getPathToNode,
  getWeaponNode,
  isLegalEquip,
} from './weapon-tree';

/** Bumped for maps + fresh economy/unlocks. */
const SAVE_KEY = 'tank-survivors-meta-v3';

export interface MetaSave {
  currency: ScrapBundle;
  unlockedNodeIds: string[];
  equippedLeafId: string;
  selectedMapId: MapId;
  bestTimeByMap: Record<MapId, number>;
  /** Max across maps (display convenience). */
  bestTimeSec: number;
  milestones: string[];
}

function defaultSave(): MetaSave {
  return {
    currency: emptyScrap(),
    unlockedNodeIds: [STARTER_WEAPON_ID],
    equippedLeafId: STARTER_WEAPON_ID,
    selectedMapId: STARTER_MAP_ID,
    bestTimeByMap: emptyBestTimes(),
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
      const currency =
        parsed.currency && typeof parsed.currency === 'object'
          ? {
              circuit: Number(parsed.currency.circuit) || 0,
              plating: Number(parsed.currency.plating) || 0,
              core: Number(parsed.currency.core) || 0,
            }
          : base.currency;
      const bestTimeByMap = {
        ...emptyBestTimes(),
        ...(parsed.bestTimeByMap ?? {}),
      };
      let selectedMapId = parsed.selectedMapId ?? base.selectedMapId;
      if (!isMapUnlocked(selectedMapId, bestTimeByMap)) {
        selectedMapId = STARTER_MAP_ID;
      }
      return {
        ...base,
        ...parsed,
        currency,
        bestTimeByMap,
        selectedMapId,
        unlockedNodeIds: parsed.unlockedNodeIds?.length
          ? parsed.unlockedNodeIds
          : base.unlockedNodeIds,
        equippedLeafId: parsed.equippedLeafId ?? base.equippedLeafId,
        milestones: parsed.milestones ?? [],
        bestTimeSec:
          parsed.bestTimeSec ?? Math.max(0, ...Object.values(bestTimeByMap)),
      };
    } catch {
      return defaultSave();
    }
  }

  private persist(next: MetaSave): void {
    this.save.set(next);
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  }

  selectMap(mapId: MapId): boolean {
    const s = this.save();
    if (!isMapUnlocked(mapId, s.bestTimeByMap)) return false;
    this.persist({ ...s, selectedMapId: mapId });
    return true;
  }

  isMapUnlocked(mapId: MapId): boolean {
    return isMapUnlocked(mapId, this.save().bestTimeByMap);
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
    if (!canAfford(s.currency, node.costs)) {
      return { ok: false, reason: formatScrapShortage(s.currency, node.costs) };
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
      currency: subtractScrap(s.currency, node.costs),
      unlockedNodeIds: [...s.unlockedNodeIds, nodeId],
    });
    return true;
  }

  applyRunResult(input: {
    mapId: MapId;
    timeSec: number;
    scrapEarned: ScrapBundle;
    milestonesReached: string[];
  }): { scrapEarned: ScrapBundle } {
    const s = this.save();
    const milestones = Array.from(
      new Set([...s.milestones, ...input.milestonesReached]),
    );
    const bestTimeByMap = {
      ...s.bestTimeByMap,
      [input.mapId]: Math.max(s.bestTimeByMap[input.mapId] ?? 0, input.timeSec),
    };
    const bestTimeSec = Math.max(
      s.bestTimeSec,
      input.timeSec,
      ...Object.values(bestTimeByMap),
    );
    this.persist({
      ...s,
      currency: addScrap(s.currency, input.scrapEarned),
      bestTimeByMap,
      bestTimeSec,
      milestones,
    });
    return { scrapEarned: input.scrapEarned };
  }

  equippedPathIds(): string[] {
    return getPathToNode(this.save().equippedLeafId).map((n) => n.id);
  }

  allNodes() {
    return WEAPON_NODES;
  }

  /** Dev: add scrap of one type (or all if omitted). */
  debugAddScrap(amount: number, type?: ScrapType): void {
    const s = this.save();
    const add = emptyScrap();
    if (type) {
      add[type] = amount;
    } else {
      add.circuit = amount;
      add.plating = amount;
      add.core = amount;
    }
    this.persist({ ...s, currency: addScrap(s.currency, add) });
  }

  /** Dev: unlock every weapon node (no cost / gate checks). */
  debugUnlockAll(): void {
    const s = this.save();
    this.persist({
      ...s,
      unlockedNodeIds: WEAPON_NODES.map((n) => n.id),
    });
  }

  /** Dev: grant 20:00 on every map so all maps unlock. */
  debugUnlockAllMaps(): void {
    const s = this.save();
    const bestTimeByMap = emptyBestTimes();
    for (const m of MAPS) {
      bestTimeByMap[m.id] = MAP_UNLOCK_TIME_SEC;
    }
    this.persist({
      ...s,
      bestTimeByMap,
      bestTimeSec: Math.max(s.bestTimeSec, MAP_UNLOCK_TIME_SEC),
    });
  }

  /** Dev: grant common milestones used by the tree / hangar. */
  debugGrantMilestones(): void {
    const s = this.save();
    const milestones = Array.from(
      new Set([
        ...s.milestones,
        'survive_1',
        'survive_5',
        'survive_10',
        'boss_a',
        'boss_b',
      ]),
    );
    this.persist({ ...s, milestones });
  }

  /** Dev: unlock the full path to a node and equip it immediately. */
  debugEquipWeapon(nodeId: string): boolean {
    const node = getWeaponNode(nodeId);
    if (!node) return false;
    const s = this.save();
    const unlocked = new Set(s.unlockedNodeIds);
    for (const part of getPathToNode(nodeId)) unlocked.add(part.id);
    this.persist({
      ...s,
      unlockedNodeIds: [...unlocked],
      equippedLeafId: nodeId,
    });
    return true;
  }

  /** Dev: wipe meta progress back to defaults. */
  debugResetSave(): void {
    localStorage.removeItem(SAVE_KEY);
    this.persist(defaultSave());
  }
}
