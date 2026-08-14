import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'pokemon', pathMatch: 'full' },
  {
    path: 'pokemon',
    // Lazy-loaded so each screen ships as its own chunk.
    loadComponent: () =>
      import('./features/pokemon-list/pokemon-list.page').then((m) => m.PokemonListPage),
    title: 'Pokédex',
  },
  {
    path: 'pokemon/:id',
    loadComponent: () =>
      import('./features/pokemon-detail/pokemon-detail.page').then((m) => m.PokemonDetailPage),
    title: 'Pokémon detail',
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/favorites/favorites.page').then((m) => m.FavoritesPage),
    title: 'Favorites',
  },
  { path: '**', redirectTo: 'pokemon' },
];
