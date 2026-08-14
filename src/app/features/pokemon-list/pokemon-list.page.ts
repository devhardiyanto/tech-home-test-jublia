import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
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
import { TypeFilter } from '../../shared/components/type-filter/type-filter';

const PAGE_SIZE = 24;

@Component({
  selector: 'app-pokemon-list',
  imports: [
    IonContent,
    IonHeader,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
    PokemonCard,
    TypeFilter,
  ],
  templateUrl: './pokemon-list.page.html',
  styleUrl: './pokemon-list.page.css',
})
export class PokemonListPage {
  private readonly api = inject(PokemonApiService);
  private readonly router = inject(Router);
  protected readonly favorites = inject(FavoritesService);

  protected readonly items = signal<PokemonSummary[]>([]);
  protected readonly types = signal<string[]>([]);
  protected readonly selectedTypes = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Ids matching the active type filter; null means "whole Pokédex". */
  private readonly filteredIds = signal<number[] | null>(null);

  private totalCount = 0;

  protected readonly hasMore = computed(() => {
    const ids = this.filteredIds();
    return ids ? this.items().length < ids.length : this.items().length < this.totalCount;
  });

  protected readonly isEmpty = computed(
    () => !this.loading() && this.items().length === 0 && !this.error(),
  );

  /** Announced to screen readers whenever the result set changes size. */
  protected readonly resultSummary = computed(() =>
    this.loading() ? 'Loading Pokémon' : `${this.items().length} Pokémon shown`,
  );

  constructor() {
    void this.loadTypes();

    // Any filter change restarts pagination from a clean slate. The load runs
    // untracked, otherwise it would re-trigger on the signals it writes.
    effect(() => {
      const types = this.selectedTypes();
      untracked(() => void this.applyFilter(types));
    });
  }

  private async loadTypes(): Promise<void> {
    try {
      this.types.set(await this.api.getTypes());
    } catch {
      // Filter simply stays empty; the grid is still usable.
      this.types.set([]);
    }
  }

  /** Resets the grid and loads the first page for the given types. */
  private async applyFilter(types: string[]): Promise<void> {
    this.items.set([]);
    this.error.set(null);

    if (types.length === 0) {
      this.filteredIds.set(null);
      await this.loadMore();
      return;
    }

    this.loading.set(true);
    try {
      this.filteredIds.set(await this.api.getIdsForTypes(types));
      this.loading.set(false);
      await this.loadMore();
    } catch {
      this.loading.set(false);
      this.error.set('Could not load that type. Check your connection and try again.');
    }
  }

  /** Appends the next page, from either the full dex or the filtered ids. */
  protected async loadMore(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const ids = this.filteredIds();
      const offset = this.items().length;

      if (ids) {
        // Filtered mode: /type/{name} is unpaginated, so slice locally.
        const slice = ids.slice(offset, offset + PAGE_SIZE);
        const page = await Promise.all(slice.map((id) => this.api.getSummary(id)));
        this.items.update((current) => [...current, ...page]);
      } else {
        if (this.totalCount === 0) this.totalCount = await this.api.getTotalCount();
        const page = await this.api.getPage(PAGE_SIZE, offset);
        this.items.update((current) => [...current, ...page]);
      }
    } catch {
      this.error.set('Could not load more Pokémon. Check your connection and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onFavoriteToggled(id: number): void {
    this.favorites.toggle(id);
  }

  /** Segment is the desktop equivalent of the mobile tab bar. */
  protected onSegmentChange(value: string | number | undefined): void {
    if (value === 'favorites') void this.router.navigate(['/favorites']);
  }

  /** Scroll-driven paging; the Load more button covers keyboard users. */
  protected async onInfiniteScroll(event: InfiniteScrollCustomEvent): Promise<void> {
    await this.loadMore();
    await event.target.complete();
  }

  protected readonly skeletons = Array.from({ length: 8 });
}
