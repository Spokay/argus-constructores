import { Component } from '@angular/core';
import { CONTACT } from '@core/contact';

/** Design system CtaBand: closes a page above the footer, always dark. */
@Component({
  selector: 'app-cta-band',
  template: `
    <section
      class="ag-cta"
      data-theme="brochure"
      aria-label="Contacto"
      i18n-aria-label="@@cta.label"
    >
      <svg
        class="ag-cta-bands"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon class="navy" points="860,200 1200,60 1200,200" />
        <polygon class="cyan" points="1010,200 1200,122 1200,200" />
      </svg>
      <div class="ag-cta-inner">
        <p class="ag-cta-text" i18n="@@cta.text">
          Esperamos ser partícipes de la construcción de sus sueños y de sus planes estratégicos de
          crecimiento.
        </p>
        <a class="ag-btn ag-btn--on-dark" [href]="mailto" i18n="@@contactUs">Contáctanos</a>
      </div>
    </section>
  `,
})
export class CtaBand {
  readonly mailto = `mailto:${CONTACT.email}`;
}
