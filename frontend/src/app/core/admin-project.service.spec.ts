import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { testAppConfig } from '../../testing/test-providers';

import { AdminProjectService } from './admin-project.service';
import { AppConfigService } from './app-config.service';
import { ProjectRequest } from './project';

const request: ProjectRequest = {
  title: 'Villa',
  description: 'A house',
  city: 'Lyon',
  completionYear: 2024,
  category: 'RESIDENTIAL',
  published: false,
};

describe('AdminProjectService', () => {
  let service: AdminProjectService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: { value: testAppConfig } },
      ],
    });
    service = TestBed.inject(AdminProjectService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists every project', () => {
    service.list().subscribe();

    backend.expectOne({ method: 'GET', url: '/api/admin/projects' }).flush([]);
  });

  it('creates, updates and removes a project', () => {
    service.create(request).subscribe();
    const create = backend.expectOne({ method: 'POST', url: '/api/admin/projects' });
    expect(create.request.body).toEqual(request);
    create.flush({});

    service.update(7, request).subscribe();
    backend.expectOne({ method: 'PUT', url: '/api/admin/projects/7' }).flush({});

    service.remove(7).subscribe();
    backend.expectOne({ method: 'DELETE', url: '/api/admin/projects/7' }).flush(null);
  });

  it('sends the complete order', () => {
    service.reorder([2, 1]).subscribe();

    const reorder = backend.expectOne({ method: 'PUT', url: '/api/admin/projects/order' });
    expect(reorder.request.body).toEqual({ ids: [2, 1] });
    reorder.flush(null);
  });

  it('uploads one image as multipart under the "file" field', () => {
    const file = new File(['png'], 'photo.png', { type: 'image/png' });
    service.uploadImage(7, file).subscribe();

    const upload = backend.expectOne({ method: 'POST', url: '/api/admin/projects/7/images' });
    expect((upload.request.body as FormData).get('file')).toBe(file);
    upload.flush({ id: 3 });
  });

  it('removes and reorders images', () => {
    service.removeImage(7, 3).subscribe();
    backend.expectOne({ method: 'DELETE', url: '/api/admin/projects/7/images/3' }).flush(null);

    service.reorderImages(7, [4, 3]).subscribe();
    const reorder = backend.expectOne({ method: 'PUT', url: '/api/admin/projects/7/images/order' });
    expect(reorder.request.body).toEqual({ ids: [4, 3] });
    reorder.flush(null);
  });

  it('fetches an image as a blob, so the token interceptor applies', () => {
    service.imageBlob(7, 3).subscribe();

    const image = backend.expectOne('/api/admin/projects/7/images/3');
    expect(image.request.responseType).toBe('blob');
    image.flush(new Blob());
  });
});
