import { Component, computed, input } from '@angular/core';

import { MAX_BASE_STAT } from '../../../core/models/pokemon.model';

/** One labelled base-stat row with a proportional bar. */
@Component({
  selector: 'app-stat-bar',
  template: `
    <div class="stat">
      <span class="stat__label">{{ label() }}</span>

      <!-- meter role exposes the value natively; no extra live region needed. -->
      <span
        class="stat__track"
        role="meter"
        [attr.aria-valuenow]="value()"
        aria-valuemin="0"
        [attr.aria-valuemax]="max"
        [attr.aria-label]="label() + ' base stat'"
      >
        <span class="stat__fill" [style.width.%]="percent()"></span>
      </span>

      <span class="stat__value">{{ value() }}</span>
    </div>
  `,
  styleUrl: './stat-bar.css',
})
export class StatBar {
  readonly label = input.required<string>();
  readonly value = input.required<number>();

  protected readonly max = MAX_BASE_STAT;

  protected readonly percent = computed(() =>
    Math.min(100, Math.round((this.value() / MAX_BASE_STAT) * 100)),
  );
}
