import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  NamedApiResource,
  PokemonDetail,
  PokemonListResponse,
  PokemonSummary,
  TypeDetailResponse,
  idFromUrl,
  spriteUrlForId,
} from '../models/pokemon.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.pokeApiBaseUrl;

/** Sole owner of PokeAPI HTTP access — no component calls HttpClient directly. */
@Service()
export class PokemonApiService {
  private readonly http = inject(HttpClient);

  // Detail responses are immutable upstream, so cache them for the session.
  private readonly detailCache = new Map<number, PokemonDetail>();

  /** Type list is tiny and static — fetched once, reused by the filter UI. */
  private readonly typeCache = signal<string[] | null>(null);

  /**
   * One page of the full Pokedex. Returns summaries so the grid can render
   * without an extra request per card.
   */
  async getPage(limit: number, offset: number): Promise<PokemonSummary[]> {
    const res = await firstValueFrom(
      this.http.get<PokemonListResponse>(`${API_BASE}/pokemon`, {
        params: { limit, offset },
      }),
    );
    // The list endpoint omits types, so resolve each entry to its detail.
    return Promise.all(res.results.map((item) => this.getSummary(idFromUrl(item.url))));
  }

  /** Total number of Pokemon, used to know when infinite scroll is exhausted. */
  async getTotalCount(): Promise<number> {
    const res = await firstValueFrom(
      this.http.get<PokemonListResponse>(`${API_BASE}/pokemon`, {
        params: { limit: 1, offset: 0 },
      }),
    );
    return res.count;
  }

  /** Full detail for one Pokemon, memoised. */
  async getDetail(id: number): Promise<PokemonDetail> {
    const cached = this.detailCache.get(id);
    if (cached) return cached;

    const detail = await firstValueFrom(
      this.http.get<PokemonDetail>(`${API_BASE}/pokemon/${id}`),
    );
    this.detailCache.set(id, detail);
    return detail;
  }

  /** Card-shaped projection of a detail response. */
  async getSummary(id: number): Promise<PokemonSummary> {
    const detail = await this.getDetail(id);
    return {
      id: detail.id,
      name: detail.name,
      spriteUrl:
        detail.sprites.other?.['official-artwork']?.front_default ??
        detail.sprites.front_default ??
        spriteUrlForId(detail.id),
      types: detail.types.map((t) => t.type.name),
    };
  }

  /** All selectable type names, sorted, fetched at most once per session. */
  async getTypes(): Promise<string[]> {
    const cached = this.typeCache();
    if (cached) return cached;

    const res = await firstValueFrom(
      this.http.get<{ results: NamedApiResource[] }>(`${API_BASE}/type`),
    );
    // `unknown` and `stellar` are placeholder types with no real roster.
    const names = res.results
      .map((t) => t.name)
      .filter((name) => name !== 'unknown' && name !== 'stellar')
      .sort();
    this.typeCache.set(names);
    return names;
  }

  /**
   * Ids belonging to every given type (AND across types). `/type/{name}` is
   * unpaginated, so the caller paginates this array client-side.
   */
  async getIdsForTypes(types: string[]): Promise<number[]> {
    const perType = await Promise.all(
      types.map(async (type) => {
        const res = await firstValueFrom(
          this.http.get<TypeDetailResponse>(`${API_BASE}/type/${type}`),
        );
        return new Set(res.pokemon.map((entry) => idFromUrl(entry.pokemon.url)));
      }),
    );

    // Intersect so multi-select narrows the result instead of widening it.
    const [first, ...rest] = perType;
    const intersection = [...first].filter((id) => rest.every((set) => set.has(id)));

    // Ids above 10000 are alternate forms — they pollute the grid, so drop them.
    return intersection.filter((id) => id <= 10000).sort((a, b) => a - b);
  }
}
