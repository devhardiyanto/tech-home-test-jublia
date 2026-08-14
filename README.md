# Pokédex — Jublia AI Front-End Take Home Test

An Angular 22 Pokédex built on the REST [PokeAPI](https://pokeapi.co/). It runs as a
desktop web app, a mobile web app, and a native Android/iOS app via Ionic + Capacitor.

---

## Requirements coverage

| Requirement | Where it lives |
|---|---|
| Browse via infinite scroll | `features/pokemon-list` — an `IntersectionObserver` sentinel rooted on `ion-content`'s scroller, plus a **Load more** button so paging is reachable by keyboard and screen reader |
| Detailed information | `features/pokemon-detail` — base stats, abilities (hidden flagged), height, weight, types |
| Image per Pokémon | Official artwork on cards and detail, with the front sprite as fallback |
| Favourite + favourites list | `core/services/favorites.service.ts` (signals + `localStorage`), `features/favorites` |
| Filter by type | `shared/components/type-filter` — multi-select, intersected (AND), not unioned |
| Desktop + mobile web | One component tree, responsive CSS at the wireframe breakpoints |
| Native iOS + Android | Ionic 8 + Capacitor 8, `capacitor.config.ts`, `android/` and `ios/` committed |

---

## Getting started

Requires **Node 20+** and npm 10+.

```bash
npm ci          # install exact dependency versions
npm start       # dev server at http://localhost:4200
npm test        # Vitest suite (22 tests)
npm run build   # production build into dist/tech-home-test/browser
```

No API key, backend, or database is needed — PokeAPI is public and unauthenticated.

### Configuration

There is no `.env`. The Angular build system does not read `.env` files, and this is a
static SPA, so any value would ship to the browser regardless. Configuration lives in
`src/environments/`, and `angular.json` swaps `environment.ts` for `environment.prod.ts`
on production builds. Values are baked in at build time, which is also what Capacitor
native builds require since they have no runtime environment.

| Key | Default |
|---|---|
| `pokeApiBaseUrl` | `https://pokeapi.co/api/v2` |
| `pageSize` | `24` cards per infinite-scroll page |

---

## Running the native app

```bash
npm run build          # web assets must exist first
npx cap sync           # copy assets + native plugins into android/ and ios/
npx cap open android   # opens Android Studio
```

Build a debug APK from the command line:

```bash
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

### Native build status — read before evaluating

Both platforms are configured and `npx cap sync` succeeds for each. Neither binary was
produced on the development machine, and neither is claimed to work:

- **Android — not build-verified.** Capacitor 8 compiles against **Java 21**; the machine
  used had JDK 17, and `./gradlew assembleDebug` stops at
  `error: invalid source release: 21`. The Android SDK side is fine (platform 36 and
  build-tools 35 resolve, Gradle runs, 77 tasks execute). Installing JDK 21 and pointing
  `JAVA_HOME` at it is expected to be the only step needed.
- **iOS — not build-verified.** Producing an `.ipa` needs macOS and Xcode, which were not
  available. Only Capacitor's cross-platform APIs are used, so there is no iOS-specific
  code path, but the build itself is unverified.

---

## Architecture

```
src/app/
├─ core/
│  ├─ models/pokemon.model.ts        # typed PokeAPI shapes + helpers
│  └─ services/
│     ├─ pokemon-api.service.ts      # sole owner of HTTP access, caches details
│     └─ favorites.service.ts        # signal state mirrored to localStorage
├─ shared/components/                # pokemon-card, type-filter, stat-bar, empty-state
└─ features/                         # pokemon-list, pokemon-detail, favorites (lazy)
```

- **No component calls `HttpClient` directly.** All requests go through `PokemonApiService`.
- **State is signals throughout.** The app is zoneless (Angular 22 default, no `zone.js`
  dependency), so non-signal state would simply not re-render.
- **Routes are lazy** via `loadComponent`, so each screen is its own chunk.

### Data source: REST, not GraphQL

The brief allows either. REST was chosen after checking both:

- `graphql-pokemon2.vercel.app` exposes `pokemons(first: Int!)` with **no offset or
  cursor**, which makes real infinite-scroll pagination impossible.
- It has no server-side type filter, no full base stats (only `maxHP`), and no abilities.
- Its schema mixes in Pokémon GO fields (`maxCP`, `fleeRate`) that do not fit this brief.

REST gives `limit`/`offset` for paging and a dedicated `/type/{name}` endpoint.

### Type filtering

`/type/{name}` returns every Pokémon of that type at once, unpaginated. So when a filter
is active the app fetches the id lists, **intersects** them (selecting Fire + Flying
yields only Pokémon that are both), and paginates that array client-side. Ids above
`10000` are dropped because they are alternate forms rather than distinct Pokémon.

---

## Accessibility

Treated as acceptance criteria, not polish:

- Favourite toggles are real `<button>`s carrying `aria-pressed` and a label that names
  the Pokémon and the action.
- Infinite scroll has a **Load more** button, so paging never depends on a scroll wheel.
- Stat bars use `role="meter"` with `aria-valuenow`/`aria-valuemax`.
- Result counts are announced through a polite live region.
- Focus is never suppressed; `:focus-visible` is styled globally.
- Type chip colours are paired with contrasting text (ice and rock use dark text) to
  clear WCAG AA.
- Touch targets on the favourite control are 44px.

---

## Testing

```bash
npm test
```

22 tests across 5 files (Vitest + jsdom):

- `pokemon-api.service.spec.ts` — paging params, detail caching, multi-type
  intersection, alternate-form filtering, placeholder-type removal.
- `favorites.service.spec.ts` — toggle, ordering, persistence, corrupt-storage recovery.
- `pokemon-card.spec.ts` — rendering, routerLink target, `aria-pressed`, and that the
  heart emits without triggering navigation.
- `pokemon-list.page.spec.ts` — the next page **appends** rather than replaces.
- `app.spec.ts` — tab bar visible on list/favorites, hidden on detail.

`vitest.config.ts` sets the jsdom environment and inlines Ionic's packages, which ship
directory imports that Node's ESM resolver rejects.

---

## Responsive behaviour

| Breakpoint | Layout |
|---|---|
| ≤ 599px | 2-column grid, bottom tab bar, filter in a bottom sheet behind a FAB |
| 600–1023px | 3-column grid, same mobile chrome |
| ≥ 1024px | 4-column grid, header segment replaces the tab bar, filter chips inline |

The detail screen has no tab bar at any width — the back arrow is the only way out.

---

## Known limitations

- **Neither native binary was built.** Android needs JDK 21, iOS needs macOS/Xcode.
  See "Native build status" above for exactly how far each got.
- **Listing a page costs 1 + N requests.** PokeAPI's list endpoint omits types and
  sprites, so each card needs its detail record. Responses are cached per session, and
  revisits are free, but the first paint of a page issues 24 parallel requests. A
  backend-for-frontend would fix this properly; it is out of scope here.
- **No E2E tests.** `ng e2e` ships without a framework in Angular CLI, and adding one
  was not worth the time against unit coverage of the same logic.
- **Scroll-triggered paging is not automation-verified.** The append itself is covered
  by `pokemon-list.page.spec.ts` and the **Load more** button was exercised by hand, but
  the browser used for verification throttled its renderer (no `scroll` events were
  dispatched even as `scrollTop` changed), so the sentinel could not be observed firing.
  Worth a manual pass in a normal browser window.
