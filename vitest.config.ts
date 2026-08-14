import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom gives the tests a DOM plus localStorage, which FavoritesService uses.
    environment: 'jsdom',
    // localStorage needs a real origin; jsdom's default about:blank has none.
    environmentOptions: { jsdom: { url: 'http://localhost' } },
    server: {
      deps: {
        // Ionic ships directory imports that Node's ESM resolver rejects;
        // inlining lets Vite resolve them instead.
        inline: [/@ionic\/angular/, /@ionic\/core/, /ionicons/],
      },
    },
  },
});
