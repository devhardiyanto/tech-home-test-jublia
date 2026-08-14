import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
