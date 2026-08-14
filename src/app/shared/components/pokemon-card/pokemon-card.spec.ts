import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PokemonCard } from './pokemon-card';
import { PokemonSummary } from '../../../core/models/pokemon.model';

const PIKACHU: PokemonSummary = {
  id: 25,
  name: 'pikachu',
  spriteUrl: 'art-25.png',
  types: ['electric'],
};

describe('PokemonCard', () => {
  let fixture: ComponentFixture<PokemonCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonCard);
    fixture.componentRef.setInput('pokemon', PIKACHU);
    await fixture.whenStable();
  });

  it('renders the name, padded dex number and types', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.card__name')?.textContent).toContain('pikachu');
    expect(el.querySelector('.card__dex')?.textContent).toContain('#0025');
    expect(el.querySelector('.type-chip')?.getAttribute('data-type')).toBe('electric');
  });

  it('points the card link at the detail route', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');

    expect(link?.getAttribute('href')).toBe('/pokemon/25');
  });

  it('exposes the favourite state through aria-pressed', async () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector('.card__fav');
    expect(button?.getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('isFavorite', true);
    await fixture.whenStable();

    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.getAttribute('aria-label')).toContain('Remove');
  });

  it('emits the id and suppresses navigation when the heart is clicked', async () => {
    let emitted: number | undefined;
    fixture.componentInstance.favoriteToggled.subscribe((id) => (emitted = id));

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.card__fav',
    ) as HTMLButtonElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    await fixture.whenStable();

    expect(emitted).toBe(25);
    // preventDefault keeps the surrounding routerLink from firing.
    expect(event.defaultPrevented).toBe(true);
  });
});
