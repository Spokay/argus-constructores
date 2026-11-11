import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { aProject } from '../../../testing/projects';
import { provideTestingEnvironment } from '../../../testing/test-providers';

import { Projects } from './projects';

describe('Projects', () => {
  async function render(projects: ReturnType<typeof aProject>[]) {
    TestBed.configureTestingModule({
      imports: [Projects],
      providers: [provideTestingEnvironment(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(Projects);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/projects').flush(projects);
    // Embla starts after the render that shows the slides; the next pass shows its measures.
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      element,
      button: (label: string) =>
        element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!,
      selectedDot: () =>
        Array.from(element.querySelectorAll('.dot')).findIndex((dot) => dot.ariaCurrent === 'true'),
    };
  }

  afterEach(() => document.querySelectorAll('app-projects').forEach((host) => host.remove()));

  it('shows one slide per project and pages through them with the arrows', async () => {
    const { fixture, element, button, selectedDot } = await render(
      [1, 2, 3, 4, 5].map((id) => aProject({ id })),
    );

    expect(element.querySelectorAll('.embla-slide app-project-card').length).toBe(5);
    // Cards per view follow the window width, so the page count does too.
    expect(element.querySelectorAll('.dot').length).toBeGreaterThan(1);
    expect(selectedDot()).toBe(0);

    button('Proyecto siguiente').click();
    fixture.detectChanges();
    expect(selectedDot()).toBe(1);

    button('Proyecto anterior').click();
    fixture.detectChanges();
    expect(selectedDot()).toBe(0);
  });

  it('filters the slides by sector, offering only the sectors that have projects', async () => {
    const { fixture, element } = await render([
      aProject({ id: 1, sector: 'HOSPITAL' }),
      aProject({ id: 2, sector: 'HOUSING' }),
      aProject({ id: 3, sector: 'HOSPITAL' }),
    ]);
    const filters = () =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('.sector-filter button'));
    const pressed = () =>
      filters()
        .filter((b) => b.ariaPressed === 'true')
        .map((b) => b.textContent?.trim());
    const slides = () => element.querySelectorAll('.embla-slide').length;

    expect(filters().map((b) => b.textContent?.trim())).toEqual([
      'Todos',
      'Sector hospitalario',
      'Sector vivienda',
    ]);
    expect(pressed()).toEqual(['Todos']);

    filters()[2].click();
    fixture.detectChanges();
    expect(slides()).toBe(1);
    expect(pressed()).toEqual(['Sector vivienda']);

    filters()[0].click();
    fixture.detectChanges();
    expect(slides()).toBe(3);
  });

  it('shows no controls when every project fits in one view', async () => {
    const { element } = await render([aProject()]);

    expect(element.querySelector('.projects-controls')).toBeNull();
    expect(element.querySelector('.dot')).toBeNull();
  });

  it('says so when no project is published', async () => {
    const { element } = await render([]);

    expect(element.textContent).toContain('Aún no hay proyectos publicados.');
  });
});
