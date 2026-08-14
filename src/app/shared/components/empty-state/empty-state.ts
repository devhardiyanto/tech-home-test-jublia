import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { funnelOutline, heartOutline, searchOutline } from 'ionicons/icons';

/** Centred icon + message + optional CTA, shared by every empty screen. */
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

      @if (ctaLabel()) {
        <!-- Routes when given a link, otherwise reports back to the parent. -->
        @if (ctaLink(); as link) {
          <ion-button [routerLink]="link">{{ ctaLabel() }}</ion-button>
        } @else {
          <ion-button (click)="ctaClicked.emit()">{{ ctaLabel() }}</ion-button>
        }
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

  /** Fired by the CTA when no `ctaLink` is supplied. */
  readonly ctaClicked = output<void>();

  constructor() {
    // Registered here so the component works wherever it is dropped in.
    addIcons({ heartOutline, funnelOutline, searchOutline });
  }
}
