import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { AdminProjectService } from '@core/admin-project.service';
import { Project, ProjectRequest } from '@core/project';
import { sectorLine } from '@core/project-format';
import { Observable } from 'rxjs';

/** Every project, hidden ones included: publish, reorder, delete. */
@Component({
  selector: 'app-project-list',
  templateUrl: 'project-list.html',
  styleUrl: 'project-list.css',
  imports: [RouterLink],
})
export class ProjectList {
  private readonly adminProjectService = inject(AdminProjectService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly projects = signal<Project[]>([]);
  readonly error = signal<string | null>(null);
  readonly sectorLine = sectorLine;

  constructor() {
    this.reload();
  }

  togglePublished(project: Project): void {
    this.run(
      this.adminProjectService.update(project.id, {
        ...toRequest(project),
        published: !project.published,
      }),
    );
  }

  /** Swaps the project with its neighbour and saves the whole order. */
  move(index: number, offset: -1 | 1): void {
    const ids = this.projects().map((project) => project.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    this.run(this.adminProjectService.reorder(ids));
  }

  remove(project: Project): void {
    if (confirm($localize`:@@admin.confirmDelete:¿Eliminar «${project.name}:name:» y su foto?`)) {
      this.run(this.adminProjectService.remove(project.id));
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }

  private run(action: Observable<unknown>): void {
    this.error.set(null);
    action.subscribe({
      next: () => this.reload(),
      error: () =>
        this.error.set($localize`:@@admin.saveError:Error: no se pudo guardar el cambio.`),
    });
  }

  private reload(): void {
    this.adminProjectService.list().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () =>
        this.error.set($localize`:@@admin.loadError:Error: no se pudieron cargar los proyectos.`),
    });
  }
}

function toRequest(project: Project): ProjectRequest {
  const { name, purpose, client, areaM2, valueSmmlv, city, sector, status, published } = project;
  return { name, purpose, client, areaM2, valueSmmlv, city, sector, status, published };
}
