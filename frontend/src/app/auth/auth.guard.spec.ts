import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  function runGuard(token: string | null): boolean | UrlTree {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { token: () => token } }],
    });
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  it('lets an authenticated user through', () => {
    expect(runGuard('jwt')).toBeTrue();
  });

  it('redirects an anonymous user to the login page', () => {
    const result = runGuard(null);

    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
  });
});
