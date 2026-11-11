import { Component, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProjectCard } from '@components/project-card/project-card';
import { ProjectService } from '@core/project.service';
import { tap } from 'rxjs';

/** Home section “Proyectos”: every published project, in the admin's order. */
@Component({
  selector: 'app-projects',
  template: `
    <section class="ag-section" id="projects">
      <h2 class="page-title" i18n="@@nav.projects">Proyectos</h2>
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
  `,
  imports: [ProjectCard],
})
export class Projects {
  /** Emitted once the list has arrived: it changes the height of everything below it. */
  readonly loaded = output();
  readonly projects = toSignal(
    inject(ProjectService)
      .list()
      .pipe(tap(() => this.loaded.emit())),
  );
}
