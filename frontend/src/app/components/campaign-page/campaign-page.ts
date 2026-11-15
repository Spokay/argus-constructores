import { Component, LOCALE_ID, afterNextRender, computed, inject } from '@angular/core';
import { CAMPAIGN, pad, ticker, timeLeft } from '@core/campaign';
import { CONTACT } from '@core/contact';

/** Gleam's embed script: it turns every `.e-widget` link on the page into the campaign widget. */
export const GLEAM_SCRIPT = 'https://widget.gleamjs.io/e.js';

/** Temporary campaign page, linked from the banner. Its text is still to be written. */
@Component({
  selector: 'app-campaign-page',
  templateUrl: './campaign-page.html',
  styleUrl: './campaign-page.css',
})
export class CampaignPage {
  private readonly now = ticker();

  readonly title = CAMPAIGN.title;
  readonly endsAt = CAMPAIGN.endsAt;
  // Intl rather than DatePipe: the pipe would land in the initial bundle (shared chunk).
  readonly endDate = this.endsAt.toLocaleDateString(inject(LOCALE_ID), { dateStyle: 'long' });
  readonly pad = pad;
  readonly left = computed(() => timeLeft(CAMPAIGN.endsAt, this.now()));
  readonly mailto = `mailto:${CONTACT.email}`;

  constructor() {
    // Angular strips <script> from templates, and e.js converts the links present when it runs,
    // which an SPA visit renders later: (re)load it on every visit, after the link exists.
    afterNextRender(() => {
      document.querySelector(`script[src="${GLEAM_SCRIPT}"]`)?.remove();
      const script = document.createElement('script');
      script.src = GLEAM_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    });
  }
}
