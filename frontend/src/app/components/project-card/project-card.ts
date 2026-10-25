import { Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '@core/project';
import { formatArea, sectorLine } from '@core/project-format';
import { ProjectService } from '@core/project.service';

/** Design system ProjectCard: cover photo over a dark panel, the whole card a link. */
@Component({
  selector: 'app-project-card',
  templateUrl: 'project-card.html',
  imports: [RouterLink],
  host: { style: 'display: contents' },
})
export class ProjectCard {
  private readonly projectService = inject(ProjectService);
  private readonly locale = inject(LOCALE_ID);

  readonly project = input.required<Project>();

  readonly coverUrl = computed(() => {
    const { id, imageIds } = this.project();
    return imageIds.length ? this.projectService.imageUrl(id, imageIds[0]) : null;
  });
  readonly sector = computed(() => sectorLine(this.project()));
  readonly area = computed(() => {
    const area = this.project().areaM2;
    return area === null ? null : formatArea(area, this.locale);
  });
}
