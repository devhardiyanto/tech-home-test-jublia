import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { PokemonApiService } from '../../core/services/pokemon-api.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PokemonSummary } from '../../core/models/pokemon.model';
import { PokemonCard } from '../../shared/components/pokemon-card/pokemon-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-favorites',
  imports: [
    IonContent,
    IonHeader,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
    PokemonCard,
    EmptyState,
  ],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.css',
})
export class FavoritesPage {
  private readonly api = inject(PokemonApiService);
  private readonly router = inject(Router);
  protected readonly favorites = inject(FavoritesService);

  protected readonly items = signal<PokemonSummary[]>([]);
  protected readonly loading = signal(false);

  constructor() {
    // The favourites set is finite and local — no pagination needed here.
    effect(() => {
      const ids = this.favorites.favoriteIds();
      void this.load(ids);
    });
  }

  private async load(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    try {
      // Detail responses are cached, so re-hearting is instant.
      this.items.set(await Promise.all(ids.map((id) => this.api.getSummary(id))));
    } finally {
      this.loading.set(false);
    }
  }

  /** Un-hearting removes the card immediately (wireframe 1c). */
  protected onFavoriteToggled(id: number): void {
    this.favorites.toggle(id);
  }

  protected onSegmentChange(value: string | number | undefined): void {
    if (value === 'all') void this.router.navigate(['/pokemon']);
  }
}
