import { Component, computed, input, model, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, funnel } from 'ionicons/icons';

/**
 * Type filter in two presentations: an inline chip row on desktop and a
 * FAB-triggered bottom sheet on mobile, per wireframe 1a.
 */
@Component({
  selector: 'app-type-filter',
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './type-filter.html',
  styleUrl: './type-filter.css',
})
export class TypeFilter {
  readonly types = input.required<string[]>();

  /** Two-way so the list page owns the applied selection. */
  readonly selected = model<string[]>([]);

  protected readonly sheetOpen = signal(false);

  /** Sheet edits happen on a draft so cancelling leaves the grid untouched. */
  protected readonly draft = signal<string[]>([]);

  protected readonly hasSelection = computed(() => this.selected().length > 0);

  constructor() {
    addIcons({ funnel, close });
  }

  protected isOn(type: string): boolean {
    return this.selected().includes(type);
  }

  protected isDraftOn(type: string): boolean {
    return this.draft().includes(type);
  }

  /** Desktop chips apply immediately — no confirm step. */
  protected toggle(type: string): void {
    this.selected.update((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    );
  }

  protected toggleDraft(type: string): void {
    this.draft.update((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    );
  }

  protected clear(): void {
    this.selected.set([]);
  }

  protected openSheet(): void {
    // Seed the draft from what is currently applied.
    this.draft.set([...this.selected()]);
    this.sheetOpen.set(true);
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
  }

  protected apply(): void {
    this.selected.set([...this.draft()]);
    this.sheetOpen.set(false);
  }

  protected clearDraft(): void {
    this.draft.set([]);
  }
}
