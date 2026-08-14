import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { PokemonListPage } from './pokemon-list.page';
import { PokemonDetail } from '../../core/models/pokemon.model';

const API = 'https://pokeapi.co/api/v2';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** jsdom has no IntersectionObserver; the sentinel effect needs one to exist. */
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function detailFixture(id: number): PokemonDetail {
  return {
    id,
    name: `mon-${id}`,
    height: 7,
    weight: 69,
    sprites: { front_default: `s-${id}.png` },
    types: [{ slot: 1, type: { name: 'fire', url: '' } }],
    stats: [],
    abilities: [],
  };
}

/** Answers a `/pokemon?limit&offset` page plus the detail call per entry. */
async function flushPage(http: HttpTestingController, offset: number, size: number) {
  const list = http.expectOne(`${API}/pokemon?limit=24&offset=${offset}`);
  list.flush({
    count: 1302,
    next: null,
    previous: null,
    results: Array.from({ length: size }, (_, i) => ({
      name: `mon-${offset + i + 1}`,
      url: `${API}/pokemon/${offset + i + 1}/`,
    })),
  });

  await tick();
  for (let i = 0; i < size; i++) {
    const id = offset + i + 1;
    http.expectOne(`${API}/pokemon/${id}`).flush(detailFixture(id));
  }
  await tick();
}

describe('PokemonListPage', () => {
  let fixture: ComponentFixture<PokemonListPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      value: ObserverStub,
      configurable: true,
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [PokemonListPage],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonListPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    // The type list is requested on init; answer it so it does not stay open.
    http.expectOne(`${API}/type`).flush({ results: [{ name: 'fire', url: '' }] });

    // The first page is preceded by a count probe.
    http.expectOne(`${API}/pokemon?limit=1&offset=0`).flush({
      count: 1302,
      next: null,
      previous: null,
      results: [],
    });
    await tick();
    await flushPage(http, 0, 24);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the first page of cards', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-pokemon-card');

    expect(cards).toHaveLength(24);
  });

  it('appends the next page instead of replacing the current one', async () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.load-more__button',
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();

    button.click();
    await tick();
    await flushPage(http, 24, 24);
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-pokemon-card');
    expect(cards).toHaveLength(48);
  });
});
