import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { of, throwError } from 'rxjs';

import { provideTestingEnvironment } from '../../../testing/test-providers';

import { LoginPage } from './login-page.component';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideTestingEnvironment(), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  function submit(username: string, password: string): void {
    fixture.componentInstance.form.setValue({ username, password });
    fixture.componentInstance.submit();
    fixture.detectChanges();
  }

  it('goes to the admin page after a successful login', () => {
    authService.login.and.returnValue(of(undefined));

    submit('admin', 'secret');

    expect(authService.login).toHaveBeenCalledWith('admin', 'secret');
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('shows an error on wrong credentials', () => {
    authService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    submit('admin', 'wrong');

    const alert = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="login-error"]',
    );
    expect(alert?.textContent).toContain('Invalid username or password');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not call the server with an empty form', () => {
    submit('', '');

    expect(authService.login).not.toHaveBeenCalled();
  });
});
