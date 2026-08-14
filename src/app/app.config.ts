import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `md` everywhere so desktop web and Android render identically.
    provideIonicAngular({ mode: 'md' }),
    // `withFetch` keeps HTTP on the Fetch API, which Capacitor's native
    // WebView handles better than XHR.
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      // Restores list scroll position on back-nav, per wireframe 1b.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
