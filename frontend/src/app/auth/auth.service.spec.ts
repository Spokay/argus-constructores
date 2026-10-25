import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '@core/app-config.service';

import { testAppConfig } from '../../testing/test-providers';

import { AuthService } from './auth.service';

const STORAGE_KEY = 'argus.session';
const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

describe('AuthService', () => {
  let backend: HttpTestingController;

  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: { value: testAppConfig } },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('stores the token returned by a successful login', () => {
    const service = createService();
    const expiresAt = inOneHour();

    service.login('admin', 'secret').subscribe();
    const request = backend.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ username: 'admin', password: 'secret' });
    request.flush({ accessToken: 'jwt', expiresAt });

    expect(service.token()).toBe('jwt');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.username()).toBe('admin');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      accessToken: 'jwt',
      expiresAt,
      username: 'admin',
    });
  });

  it('restores a stored session on startup', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: 'jwt', expiresAt: inOneHour(), username: 'admin' }),
    );

    expect(createService().token()).toBe('jwt');
  });

  it('ignores an expired token', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: 'jwt', expiresAt: '2000-01-01T00:00:00Z', username: 'admin' }),
    );
    const service = createService();

    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('treats a corrupted entry as logged out', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    expect(createService().token()).toBeNull();
  });

  it('forgets the session on logout', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: 'jwt', expiresAt: inOneHour(), username: 'admin' }),
    );
    const service = createService();

    service.logout();

    expect(service.token()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
