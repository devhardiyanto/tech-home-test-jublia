/* Typed shapes for the PokeAPI REST responses we consume.
   Only the fields the UI actually needs are modelled. */

/** One entry in a paginated `/pokemon` list — the URL carries the id. */
export interface PokemonListItem {
  name: string;
  url: string;
}

/** Envelope returned by `/pokemon?limit=&offset=`. */
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

/** Named reference used all over PokeAPI (`{name, url}`). */
export interface NamedApiResource {
  name: string;
  url: string;
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedApiResource;
}

export interface PokemonStat {
  base_stat: number;
  stat: NamedApiResource;
}

export interface PokemonAbility {
  ability: NamedApiResource;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    // Hyphenated key must stay quoted; this is the high-res art used on detail.
    'official-artwork'?: { front_default: string | null };
  };
}

/** Full `/pokemon/{id}` payload. */
export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: PokemonSprites;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
}

/** `/type/{name}` — every Pokemon of that type, unpaginated. */
export interface TypeDetailResponse {
  pokemon: { pokemon: NamedApiResource; slot: number }[];
}

/** Flattened card model the list/favorites grids render. */
export interface PokemonSummary {
  id: number;
  name: string;
  spriteUrl: string;
  types: string[];
}

/** The six base stats, in the display order the wireframe fixes. */
export const STAT_ORDER = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

/** Human labels for `STAT_ORDER`, keyed by the raw PokeAPI stat name. */
export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

/** Highest base stat in gen 1-9, used to scale the stat bars. */
export const MAX_BASE_STAT = 255;

/** Extracts the numeric id from any PokeAPI resource URL. */
export function idFromUrl(url: string): number {
  // URLs always end `/<id>/`; the trailing segment is the id.
  const match = /\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : 0;
}

/** Official front sprite CDN path — avoids a detail fetch just to draw a card. */
export function spriteUrlForId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
