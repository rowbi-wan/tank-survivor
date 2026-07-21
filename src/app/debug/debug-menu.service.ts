import { Injectable, NgZone, inject, isDevMode, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, fromEvent } from 'rxjs';
import type { RunDebugApi } from './run-debug-api';

@Injectable({ providedIn: 'root' })
export class DebugMenuService {
  readonly enabled = isDevMode();
  readonly open = signal(false);
  readonly onRun = signal(false);
  readonly runApi = signal<RunDebugApi | null>(null);
  readonly confirmReset = signal(false);

  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  constructor() {
    if (!this.enabled) return;

    this.syncRoute(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.syncRoute(e.urlAfterRedirects));

    fromEvent<KeyboardEvent>(window, 'keydown')
      .pipe(takeUntilDestroyed())
      .subscribe((e) => this.zone.run(() => this.onKey(e)));
  }

  registerRun(api: RunDebugApi): void {
    this.runApi.set(api);
  }

  unregisterRun(api: RunDebugApi): void {
    if (this.runApi() === api) {
      if (this.open()) this.close();
      this.runApi.set(null);
    }
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.tryOpen();
  }

  tryOpen(): void {
    if (!this.enabled) return;
    const api = this.runApi();
    if (this.onRun() && api?.isLevelUpPending()) return;
    this.confirmReset.set(false);
    this.open.set(true);
    api?.setDebugPaused(true);
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.confirmReset.set(false);
    this.runApi()?.setDebugPaused(false);
  }

  private syncRoute(url: string): void {
    const path = url.split('?')[0];
    const onRun = path === '/run' || path.endsWith('/run');
    this.onRun.set(onRun);
    if (!onRun && this.open()) {
      // Leaving run clears pause via unregister; keep panel if meta.
    }
  }

  private onKey(e: KeyboardEvent): void {
    if (e.code === 'Backquote') {
      e.preventDefault();
      this.toggle();
      return;
    }
    if (e.code === 'Escape' && this.open()) {
      e.preventDefault();
      this.close();
    }
  }
}
