import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';

import { PokemonSummary } from '../../../core/models/pokemon.model';

/** Grid tile: sprite, name, type chips, and a favourite toggle. */
@Component({
  selector: 'app-pokemon-card',
  imports: [RouterLink, IonIcon],
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.css',
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonSummary>();
  readonly isFavorite = input(false);

  /** Emits the id so the parent owns the favourites state. */
  readonly favoriteToggled = output<number>();

  protected onToggle(event: Event): void {
    // The heart sits inside the card link — stop it navigating.
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggled.emit(this.pokemon().id);
  }

  /** `#0001` style dex number. */
  protected get dexNumber(): string {
    return `#${String(this.pokemon().id).padStart(4, '0')}`;
  }
}
