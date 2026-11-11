import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideTestingEnvironment } from '../testing/test-providers';

import { routes } from './app.routes';

describe('routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideTestingEnvironment(), provideRouter(routes)],
    }),
  );

  for (const section of ['about', 'projects']) {
    it(`sends the former /${section} page to its home section`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`/${section}`);
      expect(TestBed.inject(Router).url).toBe(`/#${section}`);
    });
  }
});
