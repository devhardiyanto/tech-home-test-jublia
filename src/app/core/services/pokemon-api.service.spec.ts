import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PokemonApiService } from './pokemon-api.service';
import { PokemonDetail } from '../models/pokemon.model';

const API = 'https://pokeapi.co/api/v2';

/** Minimal detail payload; only the fields the service reads. */
function detailFixture(id: number, name: string, types: string[]): PokemonDetail {
  return {
    id,
    name,
    height: 7,
    weight: 69,
    sprites: {
      front_default: `sprite-${id}.png`,
      other: { 'official-artwork': { front_default: `art-${id}.png` } },
    },
    types: types.map((type, index) => ({ slot: index + 1, type: { name: type, url: '' } })),
    stats: [],
    abilities: [],
  };
}

/** Lets queued microtasks run so chained requests are actually issued. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('PokemonApiService', () => {
  let service: PokemonApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PokemonApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests a page with the given limit and offset', async () => {
    const promise = service.getPage(2, 40);

    const listReq = http.expectOne(`${API}/pokemon?limit=2&offset=40`);
    expect(listReq.request.method).toBe('GET');
    listReq.flush({
      count: 1302,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: `${API}/pokemon/1/` },
        { name: 'ivysaur', url: `${API}/pokemon/2/` },
      ],
    });

    // Detail calls are chained off the list promise, so let microtasks drain.
    await tick();
    http.expectOne(`${API}/pokemon/1`).flush(detailFixture(1, 'bulbasaur', ['grass', 'poison']));
    http.expectOne(`${API}/pokemon/2`).flush(detailFixture(2, 'ivysaur', ['grass', 'poison']));

    const page = await promise;

    expect(page).toHaveLength(2);
    expect(page[0]).toEqual({
      id: 1,
      name: 'bulbasaur',
      spriteUrl: 'art-1.png',
      types: ['grass', 'poison'],
    });
  });

  it('serves a repeated detail request from cache', async () => {
    const first = service.getDetail(4);
    http.expectOne(`${API}/pokemon/4`).flush(detailFixture(4, 'charmander', ['fire']));
    await first;

    const second = await service.getDetail(4);

    // No second HTTP call — afterEach verify() would fail if one were pending.
    expect(second.name).toBe('charmander');
  });

  it('intersects ids when several types are selected', async () => {
    const promise = service.getIdsForTypes(['grass', 'poison']);

    http.expectOne(`${API}/type/grass`).flush({
      pokemon: [
        { pokemon: { name: 'bulbasaur', url: `${API}/pokemon/1/` }, slot: 1 },
        { pokemon: { name: 'oddish', url: `${API}/pokemon/43/` }, slot: 1 },
        { pokemon: { name: 'tangela', url: `${API}/pokemon/114/` }, slot: 1 },
      ],
    });
    http.expectOne(`${API}/type/poison`).flush({
      pokemon: [
        { pokemon: { name: 'bulbasaur', url: `${API}/pokemon/1/` }, slot: 1 },
        { pokemon: { name: 'oddish', url: `${API}/pokemon/43/` }, slot: 1 },
        { pokemon: { name: 'ekans', url: `${API}/pokemon/23/` }, slot: 1 },
      ],
    });

    // Tangela and Ekans belong to only one of the two types.
    expect(await promise).toEqual([1, 43]);
  });

  it('drops alternate-form ids above 10000', async () => {
    const promise = service.getIdsForTypes(['fire']);

    http.expectOne(`${API}/type/fire`).flush({
      pokemon: [
        { pokemon: { name: 'charmander', url: `${API}/pokemon/4/` }, slot: 1 },
        { pokemon: { name: 'charizard-mega-x', url: `${API}/pokemon/10034/` }, slot: 1 },
      ],
    });

    expect(await promise).toEqual([4]);
  });

  it('filters placeholder types out of the filter list', async () => {
    const promise = service.getTypes();

    http.expectOne(`${API}/type`).flush({
      results: [
        { name: 'water', url: '' },
        { name: 'unknown', url: '' },
        { name: 'fire', url: '' },
        { name: 'stellar', url: '' },
      ],
    });

    expect(await promise).toEqual(['fire', 'water']);
  });
});
