import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfigService } from './app-config.service';
import { BaseService } from './base.service';
import { Project } from './project';

/** Public, anonymous access to published projects. */
@Injectable({ providedIn: 'root' })
export class ProjectService extends BaseService {
  protected readonly baseUrl = `${inject(AppConfigService).value.resourceServer.baseUrl}/projects`;

  list(): Observable<Project[]> {
    return this.get<Project[]>();
  }

  find(id: number): Observable<Project> {
    return this.get<Project>(`${id}`);
  }

  /** A plain URL: published images need no token, so an `<img src>` can load them directly. */
  imageUrl(projectId: number, imageId: number): string {
    return this.url(`${projectId}/images/${imageId}`);
  }
}
