import { TestBed } from '@angular/core/testing';
import { Project } from '@core/project';

import { aProject } from '../../../testing/projects';
import { provideTestingEnvironment } from '../../../testing/test-providers';

import { ProjectCard } from './project-card';

describe('ProjectCard', () => {
  function render(project: Project): HTMLElement {
    TestBed.configureTestingModule({
      imports: [ProjectCard],
      providers: [provideTestingEnvironment()],
    });
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', project);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('links to the project and shows its cover, city and area', () => {
    const card = render(aProject());

    expect(card.querySelector('a')?.getAttribute('href')).toBe('/projects/1');
    expect(card.querySelector('img')?.getAttribute('src')).toBe('/api/projects/1/images/10');
    expect(card.querySelector('.ag-card-meta')?.textContent).toContain('m²');
  });

  it('keeps the full name in a tooltip, the title being cut after two lines', () => {
    const name = 'Construcción de la nueva sede del hospital regional con ampliación de urgencias';
    const card = render(aProject({ name }));

    expect(card.querySelector('.ag-card-title')?.getAttribute('title')).toBe(name);
  });

  it('shows the client when there is no area yet', () => {
    const card = render(aProject({ areaM2: null, imageIds: [] }));

    expect(card.querySelector('img')).toBeNull();
    expect(card.querySelector('.ag-card-meta')?.textContent).toContain('Agencia Logística');
  });
});
