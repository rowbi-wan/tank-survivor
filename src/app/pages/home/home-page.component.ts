import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="page">
      <div class="hero">
        <p class="eyebrow">Arena survival</p>
        <h1>Tank Survivors</h1>
        <p class="lede">
          Stay centered. Aim the turret. Surf waves of foes — then spend Circuit,
          Plating, and Core scrap on a branching cannon tree between runs.
        </p>
        <div class="actions">
          <a routerLink="/run" class="btn primary">Start Run</a>
          <a routerLink="/hangar" class="btn">Hangar</a>
        </div>
        <p class="hint">WASD move · Mouse aim · Hold click to fire</p>
      </div>
    </main>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
      }
      .hero {
        max-width: 36rem;
        text-align: center;
      }
      .eyebrow {
        font-family: 'Fredoka', sans-serif;
        color: var(--ink-soft);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-size: 0.85rem;
        margin: 0 0 0.5rem;
      }
      h1 {
        font-family: 'Fredoka', sans-serif;
        font-size: clamp(2.8rem, 8vw, 4.2rem);
        margin: 0 0 1rem;
        color: var(--pink-deep);
        text-shadow: 0 4px 0 rgba(255, 255, 255, 0.65);
      }
      .lede {
        margin: 0 0 1.75rem;
        font-size: 1.1rem;
        line-height: 1.5;
        color: var(--ink);
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .hint {
        margin-top: 1.5rem;
        color: var(--ink-soft);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class HomePageComponent {}
