import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(dismissSplash)
  .catch((err) => {
    // Leave the splash up on failure rather than showing a blank page.
    console.error(err);
  });

/** Fades out the index.html splash, then drops it from the DOM. */
function dismissSplash(): void {
  const splash = document.getElementById('app-splash');
  if (!splash) return;

  splash.classList.add('is-hidden');
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });

  // Fallback for reduced-motion, where no transition fires.
  setTimeout(() => splash.remove(), 600);
}
