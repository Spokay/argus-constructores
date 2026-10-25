import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppConfigService } from '@core/app-config.service';

import { AuthService } from './auth.service';

/** Attaches the bearer token to calls to our own API only — never to a third-party URL. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const apiBaseUrl = inject(AppConfigService).value.resourceServer.baseUrl;

  if (!token || !req.url.startsWith(apiBaseUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
