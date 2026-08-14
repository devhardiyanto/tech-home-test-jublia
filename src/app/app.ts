import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart, heartOutline, list, listOutline } from 'ionicons/icons';

import { FavoritesService } from './core/services/favorites.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly favorites = inject(FavoritesService);

  /** Current URL as a signal — Router.url alone is not reactive. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Detail is a leaf screen: wireframe 1b drops the tab bar there. */
  protected readonly showTabs = computed(() => !/^\/pokemon\/\d+/.test(this.url()));

  protected readonly onFavorites = computed(() => this.url().startsWith('/favorites'));

  constructor() {
    addIcons({ heart, heartOutline, list, listOutline });
  }
}
