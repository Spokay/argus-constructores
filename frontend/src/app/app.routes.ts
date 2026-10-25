import { Routes } from '@angular/router';
import { authGuard } from '@auth/auth.guard';
import { ProjectForm } from '@components/admin/project-form/project-form';
import { ProjectList } from '@components/admin/project-list/project-list';
import { ErrorPage } from '@components/error-page/error-page';
import { Home } from '@components/home/home';
import { LoginPage } from '@components/login-page/login-page.component';
import { ProjectDetail } from '@components/project-detail/project-detail';
import { Projects } from '@components/projects/projects';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'projects', component: Projects },
  { path: 'projects/:id', component: ProjectDetail },
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
