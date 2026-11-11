import { TestBed } from '@angular/core/testing';

import { provideTestingEnvironment } from '../../../testing/test-providers';

import { Services } from './services';

describe('Services', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [Services],
      providers: [provideTestingEnvironment()],
    });
    const fixture = TestBed.createComponent(Services);
    // In view whatever else the test page holds.
    (fixture.nativeElement as HTMLElement).style.cssText = 'position: fixed; inset: 0';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => document.querySelectorAll('app-services').forEach((host) => host.remove()));

  it('shows the three services', () => {
    const { element } = render();

    const titles = Array.from(element.querySelectorAll('.service-title'), (title) =>
      title.textContent?.trim(),
    );
    expect(titles).toEqual(['Consultoría', 'Construcción', 'Comercialización']);
  });

  it('reveals a column once it is in view', async () => {
    const { fixture, element } = render();
    expect(element.querySelector('.service.is-revealed')).toBeNull();

    // IntersectionObserver reports on a later frame.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('.service.is-revealed')).not.toBeNull();
  });
});
