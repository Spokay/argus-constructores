import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CtaBand } from '@components/cta-band/cta-band';
import { ProjectCard } from '@components/project-card/project-card';
import { ProjectService } from '@core/project.service';

/** Every published project, in the admin's order. */
@Component({
  selector: 'app-projects',
  template: `
    <section class="ag-section">
      <h1 class="page-title" i18n="@@nav.projects">Proyectos</h1>
      <p class="page-lead" i18n="@@projects.lead">
        Nuestra experiencia se concentra en centros hospitalarios, educativos y gubernamentales.
      </p>
      @if (projects(); as projects) {
        <div class="ag-grid">
          @for (project of projects; track project.id) {
            <app-project-card [project]="project" />
          } @empty {
            <p i18n="@@projects.empty">Aún no hay proyectos publicados.</p>
          }
        </div>
      }
    </section>
    <app-cta-band />
  `,
  imports: [ProjectCard, CtaBand],
})
export class Projects {
  readonly projects = toSignal(inject(ProjectService).list());
}
