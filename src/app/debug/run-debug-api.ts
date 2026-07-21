import type { EnemyKind } from '../game/core/types';

/** Run-session cheats exposed to the debug menu while on /run. */
export interface RunDebugApi {
  isLevelUpPending(): boolean;
  setDebugPaused(paused: boolean): void;
  setGodMode(on: boolean): void;
  isGodMode(): boolean;
  healFull(): void;
  addTime(seconds: number): void;
  setTime(seconds: number): void;
  getCurrentWeaponId(): string;
  setWeapon(nodeId: string): void;
  spawnEnemy(kind: EnemyKind): void;
  clearEnemies(): void;
}
