import { Routes } from '@angular/router';
import { authGuard } from '@auth/auth.guard';
import { Admin } from '@components/admin/admin';
import { ErrorPage } from '@components/error-page/error-page';
import { Home } from '@components/home/home';
import { LoginPage } from '@components/login-page/login-page.component';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'unauthorized', component: ErrorPage, data: { statusCode: 401 } },
  { path: 'forbidden', component: ErrorPage, data: { statusCode: 403 } },
  { path: 'not-found', component: ErrorPage, data: { statusCode: 404 } },
  // Fallback route (404 page) - must be last
  { path: '**', component: ErrorPage, data: { statusCode: 404 } },
];
