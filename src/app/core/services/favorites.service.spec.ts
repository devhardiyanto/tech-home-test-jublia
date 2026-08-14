import { TestBed } from '@angular/core/testing';

import { FavoritesService } from './favorites.service';

const STORAGE_KEY = 'pokedex.favorites';

/** In-memory Storage stand-in — the runner does not expose a global one. */
function createStorageStub(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
  } as Storage;
}

describe('FavoritesService', () => {
  beforeEach(() => {
    // Fresh storage per test so persistence cases cannot leak into each other.
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorageStub(),
      configurable: true,
      writable: true,
    });
    TestBed.configureTestingModule({});
  });

  it('starts empty when nothing is stored', () => {
    const service = TestBed.inject(FavoritesService);

    expect(service.isEmpty()).toBe(true);
    expect(service.favoriteIds()).toEqual([]);
  });

  it('adds an id on first toggle and removes it on the second', () => {
    const service = TestBed.inject(FavoritesService);

    expect(service.toggle(25)).toBe(true);
    expect(service.isFavorite(25)).toBe(true);
    expect(service.count()).toBe(1);

    expect(service.toggle(25)).toBe(false);
    expect(service.isFavorite(25)).toBe(false);
    expect(service.isEmpty()).toBe(true);
  });

  it('keeps favoriteIds sorted regardless of insertion order', () => {
    const service = TestBed.inject(FavoritesService);

    service.toggle(150);
    service.toggle(4);
    service.toggle(25);

    expect(service.favoriteIds()).toEqual([4, 25, 150]);
  });

  it('restores ids that were persisted by a previous session', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 7]));

    const service = TestBed.inject(FavoritesService);

    expect(service.favoriteIds()).toEqual([1, 7]);
  });

  it('ignores corrupt stored data instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    const service = TestBed.inject(FavoritesService);

    expect(service.isEmpty()).toBe(true);
  });

  it('drops non-numeric entries from stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 'pikachu', null, 4]));

    const service = TestBed.inject(FavoritesService);

    expect(service.favoriteIds()).toEqual([1, 4]);
  });

  it('clear() empties the set', () => {
    const service = TestBed.inject(FavoritesService);
    service.toggle(1);

    service.clear();

    expect(service.isEmpty()).toBe(true);
  });
});
