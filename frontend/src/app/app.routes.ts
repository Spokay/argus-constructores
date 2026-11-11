import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard } from '@auth/auth.guard';
import { ProjectForm } from '@components/admin/project-form/project-form';
import { ProjectList } from '@components/admin/project-list/project-list';
import { ErrorPage } from '@components/error-page/error-page';
import { Home } from '@components/home/home';
import { LoginPage } from '@components/login-page/login-page.component';
import { ProjectDetail } from '@components/project-detail/project-detail';

const toHomeSection = (fragment: string) => inject(Router).createUrlTree(['/'], { fragment });

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  // The former pages are now sections of the home page; old links land on them.
  { path: 'projects', redirectTo: () => toHomeSection('projects'), pathMatch: 'full' },
  { path: 'projects/:id', component: ProjectDetail },
  { path: 'about', redirectTo: () => toHomeSection('about'), pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: '', component: ProjectList },
      { path: 'projects/new', component: ProjectForm },
      { path: 'projects/:id', component: ProjectForm },
    ],
  },
  { path: 'unauthorized', component: ErrorPage, data: { statusCode: 401 } },
  { path: 'forbidden', component: ErrorPage, data: { statusCode: 403 } },
  { path: 'not-found', component: ErrorPage, data: { statusCode: 404 } },
  // Fallback route (404 page) - must be last
  { path: '**', component: ErrorPage, data: { statusCode: 404 } },
];
