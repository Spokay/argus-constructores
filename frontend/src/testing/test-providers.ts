import { provideHttpClient } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppConfig, AppConfigService } from '@core/app-config.service';

/**
 * Stands in for the file `AppConfigService` fetches at startup. Specs never run the app
 * initializer, so the real service's `value` is undefined — and any component reaching a
 * service that reads it would fail on a property of undefined rather than on its own logic.
 */
export const testAppConfig: AppConfig = {
  resourceServer: { baseUrl: '/api' },
  logging: { level: 'info' },
};

/**
 * Providers every component spec needs.
 *
 * `AuthService` is injected by the header and login components and pulls in `HttpClient`,
 * so a bare `TestBed` fails with `NG0201: No provider found for _HttpClient`.
 * `AppConfigService` is stubbed so specs never fetch `assets/app-config.json`.
 */
export function provideTestingEnvironment(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    provideRouter([]),
    { provide: AppConfigService, useValue: { value: testAppConfig } },
  ];
}
