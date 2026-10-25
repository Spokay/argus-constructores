import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfigService } from './app-config.service';
import { BaseService } from './base.service';
import { Project, ProjectRequest } from './project';

/** Project management; every call carries the admin token (see `authInterceptor`). */
@Injectable({ providedIn: 'root' })
export class AdminProjectService extends BaseService {
  protected readonly baseUrl = `${inject(AppConfigService).value.resourceServer.baseUrl}/admin/projects`;

  list(): Observable<Project[]> {
    return this.get<Project[]>();
  }

  find(id: number): Observable<Project> {
    return this.get<Project>(`${id}`);
  }

  create(project: ProjectRequest): Observable<Project> {
    return this.post<Project>('', project);
  }

  update(id: number, project: ProjectRequest): Observable<Project> {
    return this.put<Project>(`${id}`, project);
  }

  remove(id: number): Observable<void> {
    return this.delete<void>(`${id}`);
  }

  reorder(ids: number[]): Observable<void> {
    return this.put<void>('order', { ids });
  }

  uploadImage(projectId: number, file: File): Observable<{ id: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.post<{ id: number }>(`${projectId}/images`, form);
  }

  removeImage(projectId: number, imageId: number): Observable<void> {
    return this.delete<void>(`${projectId}/images/${imageId}`);
  }

  reorderImages(projectId: number, ids: number[]): Observable<void> {
    return this.put<void>(`${projectId}/images/order`, { ids });
  }

  /**
   * Fetched through HttpClient rather than an `<img src>`: a hidden project's images need the
   * bearer token, which the browser would not send on its own.
   */
  imageBlob(projectId: number, imageId: number): Observable<Blob> {
    return this.http.get(this.url(`${projectId}/images/${imageId}`), { responseType: 'blob' });
  }
}
