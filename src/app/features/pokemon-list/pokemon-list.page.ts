import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { TypeFilter } from '../../shared/components/type-filter/type-filter';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

import { environment } from '../../../environments/environment';

const PAGE_SIZE = environment.pageSize;

@Component({
  selector: 'app-pokemon-list',
  imports: [
    IonContent,
    IonHeader,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
    PokemonCard,
    TypeFilter,
    EmptyState,
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

  protected readonly hasFilters = computed(() => this.selectedTypes().length > 0);

  protected readonly emptyMessage = computed(() => {
    const types = this.selectedTypes();
    if (types.length === 0) return 'No Pokémon are available right now.';
    if (types.length === 1) return `No Pokémon have the ${types[0]} type.`;
    // Multi-select is an intersection, which is the usual reason for no hits.
    return `No Pokémon have all of these types at once: ${types.join(', ')}.`;
  });

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

    // Scroll-driven paging via a sentinel. Plain IntersectionObserver keeps
    // this independent of Ionic's scroll internals.
    effect((onCleanup) => {
      const el = this.sentinel()?.nativeElement;
      const content = this.content();
      // Absent during SSR/prerender; the Load more button still works there.
      if (!el || !content || typeof IntersectionObserver === 'undefined') return;

      let observer: IntersectionObserver | undefined;
      let cancelled = false;

      // Observe against ion-content's own scroller, not the viewport: the
      // viewport root misreports while the app is nested or embedded.
      void content.getScrollElement().then((root) => {
        if (cancelled) return;

        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              untracked(() => void this.loadMore());
            }
          },
          // Start fetching slightly before the sentinel scrolls into view.
          { root, rootMargin: '300px' },
        );
        observer.observe(el);
      });

      onCleanup(() => {
        cancelled = true;
        observer?.disconnect();
      });
    });
  }

  /** Bottom marker watched by the observer above. */
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  private readonly content = viewChild(IonContent);

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

  /** CTA on the empty state — drops every active type filter. */
  protected clearFilters(): void {
    this.selectedTypes.set([]);
  }

  /** Segment is the desktop equivalent of the mobile tab bar. */
  protected onSegmentChange(value: string | number | undefined): void {
    if (value === 'favorites') void this.router.navigate(['/favorites']);
  }

  protected readonly skeletons = Array.from({ length: 8 });
}
