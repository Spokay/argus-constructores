import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CtaBand } from '@components/cta-band/cta-band';
import { ProjectCard } from '@components/project-card/project-card';
import { CONTACT } from '@core/contact';
import { ProjectService } from '@core/project.service';

/** Home: the Hero, the first published projects, the closing call to action. */
@Component({
  selector: 'app-home',
  templateUrl: 'home.html',
  imports: [RouterLink, ProjectCard, CtaBand],
})
export class Home {
  private readonly projects = toSignal(inject(ProjectService).list(), { initialValue: [] });

  /** The admin's order decides which come first. */
  readonly featured = computed(() => this.projects().slice(0, 3));
  readonly mailto = `mailto:${CONTACT.email}`;
}
