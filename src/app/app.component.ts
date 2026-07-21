import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DebugMenuComponent } from './debug/debug-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DebugMenuComponent],
  template: `
    <router-outlet />
    <app-debug-menu />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class AppComponent {}
