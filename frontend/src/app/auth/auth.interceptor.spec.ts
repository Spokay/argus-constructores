import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '@core/app-config.service';

import { testAppConfig } from '../../testing/test-providers';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: string | null;

  beforeEach(() => {
    token = 'jwt';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: { value: testAppConfig } },
        { provide: AuthService, useValue: { token: () => token } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('attaches the token to API calls', () => {
    http.get('/api/projects').subscribe();

    const request = backend.expectOne('/api/projects');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt');
    request.flush([]);
  });

  it('never sends the token to another origin', () => {
    http.get('https://example.com/api/projects').subscribe();

    const request = backend.expectOne('https://example.com/api/projects');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('sends nothing when logged out', () => {
    token = null;
    http.get('/api/projects').subscribe();

    const request = backend.expectOne('/api/projects');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });
});
