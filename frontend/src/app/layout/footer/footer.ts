import { Component } from '@angular/core';
import { CONTACT } from '@core/contact';

/** Design system SiteFooter. */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
})
export class Footer {
  readonly contact = CONTACT;
  readonly mailto = `mailto:${CONTACT.email}`;
}
