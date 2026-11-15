import { Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CAMPAIGN, pad, ticker, timeLeft } from '@core/campaign';
import { filter, map } from 'rxjs';

const DISMISSED_KEY = `dismissed:${CAMPAIGN.id}`;

/**
 * Temporary campaign banner above the header: title, live countdown, link to /campaign.
 * Closing it is remembered per campaign; it disappears by itself at the deadline.
 */
@Component({
  selector: 'app-campaign-banner',
  templateUrl: './campaign-banner.html',
  styleUrl: './campaign-banner.css',
  imports: [RouterLink],
})
export class CampaignBanner {
  private readonly router = inject(Router);
  private readonly now = ticker();
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly title = CAMPAIGN.title;
  readonly endsAt = CAMPAIGN.endsAt;
  readonly endDate = this.endsAt.toLocaleDateString(inject(LOCALE_ID), { dateStyle: 'long' });
  readonly pad = pad;
  readonly dismissed = signal(readDismissed());
  readonly left = computed(() => timeLeft(CAMPAIGN.endsAt, this.now()));
  /** Not on the campaign page itself: it already shows the countdown. */
  readonly visible = computed(
    () => !this.dismissed() && this.left() !== null && !this.url().startsWith('/campaign'),
  );

  dismiss(): void {
    this.dismissed.set(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Storage blocked (private mode): the banner stays closed until the next page load.
    }
  }
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}
