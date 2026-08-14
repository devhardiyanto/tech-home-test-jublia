/* Development config. Swapped for environment.prod.ts on production builds
   via the fileReplacements entry in angular.json. */
export const environment = {
  production: false,
  pokeApiBaseUrl: 'https://pokeapi.co/api/v2',
  /** Cards fetched per infinite-scroll page. */
  pageSize: 24,
};
