import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { aProject } from '../../../testing/projects';
import { provideTestingEnvironment } from '../../../testing/test-providers';

import { ProjectDetail } from './project-detail';

describe('ProjectDetail', () => {
  function render(id: number) {
    TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [provideTestingEnvironment(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('id', String(id));
    fixture.detectChanges();
    return { fixture, backend: TestBed.inject(HttpTestingController) };
  }

  it('shows the facts and up to three other projects of the same sector', () => {
    const { fixture, backend } = render(1);
    const project = aProject({ valueSmmlv: null });
    backend.expectOne('/api/projects/1').flush(project);
    backend
      .expectOne('/api/projects')
      .flush([
        project,
        aProject({ id: 2 }),
        aProject({ id: 3, sector: 'HOUSING' }),
        aProject({ id: 4 }),
        aProject({ id: 5 }),
        aProject({ id: 6 }),
      ]);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Hospital Militar Central');
    expect(page.querySelector('.ag-facts')?.textContent).toContain('Área');
    expect(page.querySelector('.ag-facts')?.textContent).not.toContain('Valor');
    const related = Array.from(page.querySelectorAll('.ag-grid a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(related).toEqual(['/projects/2', '/projects/4', '/projects/5']);
  });

  it('says so when the project is missing or hidden', () => {
    const { fixture, backend } = render(9);
    backend.expectOne('/api/projects/9').flush('nope', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Proyecto no encontrado',
    );
  });
});
