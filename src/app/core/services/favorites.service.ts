import { Service, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'pokedex.favorites';

/** Favourited Pokemon ids, held in a signal and mirrored to localStorage. */
@Service()
export class FavoritesService {
  private readonly ids = signal<ReadonlySet<number>>(readStoredIds());

  /** Sorted ids — the favorites grid renders straight from this. */
  readonly favoriteIds = computed(() => [...this.ids()].sort((a, b) => a - b));

  readonly count = computed(() => this.ids().size);

  readonly isEmpty = computed(() => this.ids().size === 0);

  constructor() {
    // Persist on every change; effect also covers updates made elsewhere.
    effect(() => writeStoredIds(this.ids()));
  }

  /** Reactive membership test for a single id. */
  isFavorite(id: number): boolean {
    return this.ids().has(id);
  }

  /** Adds or removes an id, returning the resulting state. */
  toggle(id: number): boolean {
    const next = new Set(this.ids());
    // Set.delete reports whether anything was removed, so no extra lookup.
    const removed = next.delete(id);
    if (!removed) next.add(id);

    this.ids.set(next);
    return !removed;
  }

  clear(): void {
    this.ids.set(new Set());
  }
}

/** Reads persisted ids, tolerating absent or corrupt storage. */
function readStoredIds(): ReadonlySet<number> {
  if (typeof localStorage === 'undefined') return new Set();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    // Guard against hand-edited storage holding non-numeric junk.
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is number => typeof v === 'number'));
  } catch {
    return new Set();
  }
}

/** Writes ids back to storage; failures are non-fatal (private mode, quota). */
function writeStoredIds(ids: ReadonlySet<number>): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore — favourites stay in memory for this session.
  }
}
