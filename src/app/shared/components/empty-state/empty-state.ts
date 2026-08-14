import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

/** Centred icon + message + optional CTA, used by the favorites screen. */
@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, IonButton, IonIcon],
  template: `
    <div class="empty">
      <div class="empty__icon" aria-hidden="true">
        <ion-icon [name]="icon()" />
      </div>

      <h2 class="empty__title">{{ title() }}</h2>
      <p class="empty__body">{{ message() }}</p>

      @if (ctaLabel() && ctaLink()) {
        <ion-button [routerLink]="ctaLink()">{{ ctaLabel() }}</ion-button>
      }
    </div>
  `,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  readonly icon = input('heart-outline');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly ctaLabel = input<string | null>(null);
  readonly ctaLink = input<string | null>(null);
}
