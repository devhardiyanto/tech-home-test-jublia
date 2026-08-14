import { Component, computed, inject, input, resource } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';

import { PokemonApiService } from '../../core/services/pokemon-api.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { STAT_LABELS, STAT_ORDER, spriteUrlForId } from '../../core/models/pokemon.model';
import { StatBar } from '../../shared/components/stat-bar/stat-bar';

@Component({
  selector: 'app-pokemon-detail',
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
    StatBar,
  ],
  templateUrl: './pokemon-detail.page.html',
  styleUrl: './pokemon-detail.page.css',
})
export class PokemonDetailPage {
  private readonly api = inject(PokemonApiService);
  protected readonly favorites = inject(FavoritesService);

  /** Bound from the `:id` route param via withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly pokemonId = computed(() => Number(this.id()));

  /** resource() gives loading/error/value as signals without manual wiring. */
  protected readonly detail = resource({
    params: () => ({ id: this.pokemonId() }),
    loader: ({ params }) => this.api.getDetail(params.id),
  });

  protected readonly isFavorite = computed(() => this.favorites.isFavorite(this.pokemonId()));

  /** Stats reordered to the fixed wireframe sequence, with display labels. */
  protected readonly stats = computed(() => {
    const value = this.detail.value();
    if (!value) return [];

    return STAT_ORDER.map((key) => {
      const found = value.stats.find((s) => s.stat.name === key);
      return { label: STAT_LABELS[key], value: found?.base_stat ?? 0 };
    });
  });

  protected readonly artwork = computed(() => {
    const value = this.detail.value();
    if (!value) return '';
    return (
      value.sprites.other?.['official-artwork']?.front_default ??
      value.sprites.front_default ??
      spriteUrlForId(value.id)
    );
  });

  /** PokeAPI stores decimetres and hectograms. */
  protected readonly heightMetres = computed(() => ((this.detail.value()?.height ?? 0) / 10).toFixed(1));
  protected readonly weightKilos = computed(() => ((this.detail.value()?.weight ?? 0) / 10).toFixed(1));

  protected readonly dexNumber = computed(() => `#${String(this.pokemonId()).padStart(4, '0')}`);

  constructor() {
    addIcons({ heart, heartOutline });
  }

  protected toggleFavorite(): void {
    this.favorites.toggle(this.pokemonId());
  }
}
