import { Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CtaBand } from '@components/cta-band/cta-band';
import { ProjectCard } from '@components/project-card/project-card';
import { Project } from '@core/project';
import { formatArea, formatValue, sectorLine } from '@core/project-format';
import { ProjectService } from '@core/project.service';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

interface DetailView {
  project: Project;
  related: Project[];
}

/** Design system ProjectDetail: breadcrumb, photo + fact panel, related projects of the sector. */
@Component({
  selector: 'app-project-detail',
  templateUrl: 'project-detail.html',
  imports: [RouterLink, ProjectCard, CtaBand],
})
export class ProjectDetail {
  private readonly projectService = inject(ProjectService);
  private readonly locale = inject(LOCALE_ID);

  /** Bound from the `:id` route parameter (`withComponentInputBinding`). */
  readonly id = input.required<string>();

  /** `undefined` while loading, `null` when the project does not exist or is hidden. */
  readonly view = toSignal<DetailView | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        forkJoin([this.projectService.find(Number(id)), this.projectService.list()]).pipe(
          map(([project, all]) => ({
            project,
            related: all
              .filter((other) => other.sector === project.sector && other.id !== project.id)
              .slice(0, 3),
          })),
          catchError(() => of(null)),
        ),
      ),
    ),
  );

  readonly sector = computed(() => {
    const view = this.view();
    return view ? sectorLine(view.project) : '';
  });

  coverUrl(project: Project): string | null {
    return project.imageIds.length
      ? this.projectService.imageUrl(project.id, project.imageIds[0])
      : null;
  }

  area(value: number): string {
    return formatArea(value, this.locale);
  }

  value(value: number): string {
    return formatValue(value, this.locale);
  }
}
