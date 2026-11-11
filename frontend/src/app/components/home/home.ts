import { ViewportScroller } from '@angular/common';
import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { About } from '@components/about/about';
import { CtaBand } from '@components/cta-band/cta-band';
import { Projects } from '@components/projects/projects';
import { Services } from '@components/services/services';
import { CONTACT } from '@core/contact';

/** The one-page site: Hero, about us, services, every published project, the closing call to action. */
@Component({
  selector: 'app-home',
  templateUrl: 'home.html',
  styleUrl: 'home.css',
  imports: [RouterLink, About, Services, Projects, CtaBand],
})
export class Home {
  readonly mailto = `mailto:${CONTACT.email}`;

  private readonly route = inject(ActivatedRoute);
  private readonly scroller = inject(ViewportScroller);
  private readonly injector = inject(Injector);
  // Back/Forward restores the previous scroll position: leave it alone.
  private readonly restoring = inject(Router).currentNavigation()?.trigger === 'popstate';

  /**
   * The router scrolls to the #fragment as soon as the page renders, before the web fonts and the
   * project list settle the layout; on a direct link (/#projects, /about) scroll again once they have.
   */
  realignFragment(): void {
    const fragment = this.route.snapshot.fragment;
    if (!fragment || this.restoring) return;
    afterNextRender(
      () => void document.fonts.ready.then(() => this.scroller.scrollToAnchor(fragment)),
      { injector: this.injector },
    );
  }
}
