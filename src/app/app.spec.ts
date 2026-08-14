import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { App } from './app';

@Component({ template: '' })
class StubPage {}

describe('App shell', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideIonicAngular(),
        provideRouter([
          { path: 'pokemon', component: StubPage },
          { path: 'pokemon/:id', component: StubPage },
          { path: 'favorites', component: StubPage },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('creates the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the tab bar on the list route', async () => {
    await router.navigate(['/pokemon']);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('ion-tab-bar')).not.toBeNull();
  });

  it('shows the tab bar on the favorites route', async () => {
    await router.navigate(['/favorites']);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('ion-tab-bar')).not.toBeNull();
  });

  it('hides the tab bar on the detail route', async () => {
    await router.navigate(['/pokemon/25']);
    await fixture.whenStable();

    // Wireframe 1b: back arrow is the only way out of detail.
    expect((fixture.nativeElement as HTMLElement).querySelector('ion-tab-bar')).toBeNull();
  });
});
