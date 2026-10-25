import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { LoggerService } from '@shared/logger.service';
import { catchError, throwError } from 'rxjs';

/**
 * The header the resource server's `RequestIdFilter` reads, puts in its logging MDC, returns
 * in every error body as `traceId`, and echoes back on the response. Sending it from here is
 * what makes a line in this console and a line in the server log the same request.
 */
export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * Tags every request with an id, logs every failure, and handles the two failures that mean the
 * user cannot be here: a 401 drops the (expired or rejected) token and goes back to the login
 * page — a no-op navigation when that is where a failed login came from — and a 403 goes to
 * the error page.
 *
 * Only 401 and 403 navigate. A 404 or a 500 from one data call must not throw the user off the
 * page they are on — the caller decides how to show it, as `home.ts` does.
 */
export const errorHandlingInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const logger = inject(LoggerService);
  const authService = inject(AuthService);

  const requestId = crypto.randomUUID();

  return next(req.clone({ setHeaders: { [REQUEST_ID_HEADER]: requestId } })).pipe(
    catchError((error: HttpErrorResponse) => {
      logFailure(logger, error, requestId);

      if (error.status === 401) {
        authService.logout();
        void router.navigate(['/login']);
      }
      if (error.status === 403) {
        void router.navigate(['/forbidden']);
      }
      return throwError(() => error);
    }),
  );
};

function logFailure(logger: LoggerService, error: HttpErrorResponse, requestId: string): void {
  // Status 0 is the browser declining to say why — offline, DNS, CORS, or a blocked request.
  // It is not a server response, so it never has a status text worth printing.
  const message =
    error.status === 0
      ? `Request to ${error.url} failed before a response`
      : `${error.status} ${error.statusText} from ${error.url}`;

  // `error.error` is the parsed body: for this stack, the server's RFC 9457 problem detail,
  // whose traceId equals the requestId logged beside it.
  const context = { requestId, body: error.error };

  if (error.status === 0 || error.status >= 500) {
    logger.error(message, context);
  } else {
    logger.warn(message, context);
  }
}
