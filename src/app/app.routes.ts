import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'hangar',
    loadComponent: () =>
      import('./pages/hangar/hangar-page.component').then(
        (m) => m.HangarPageComponent,
      ),
  },
  {
    path: 'run',
    loadComponent: () =>
      import('./pages/run/run-page.component').then((m) => m.RunPageComponent),
  },
  { path: '**', redirectTo: '' },
];
