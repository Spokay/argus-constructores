import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { testAppConfig } from '../../testing/test-providers';

import { AppConfigService } from './app-config.service';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: { value: testAppConfig } },
      ],
    });
    service = TestBed.inject(ProjectService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists the published projects', () => {
    service.list().subscribe();

    backend.expectOne({ method: 'GET', url: '/api/projects' }).flush([]);
  });

  it('finds one project', () => {
    service.find(7).subscribe();

    backend.expectOne({ method: 'GET', url: '/api/projects/7' }).flush({});
  });

  it('builds a plain image URL an <img> can load', () => {
    expect(service.imageUrl(7, 3)).toBe('/api/projects/7/images/3');
  });
});
