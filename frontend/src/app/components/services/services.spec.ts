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

    // The component starts observing after its first render and IntersectionObserver reports on a
    // later frame; neither takes a fixed number of frames, so a fixed wait was flaky.
    for (let frame = 0; frame < 60 && !element.querySelector('.service.is-revealed'); frame++) {
      await new Promise(requestAnimationFrame);
      fixture.detectChanges();
    }
    expect(element.querySelector('.service.is-revealed')).not.toBeNull();
  });
});
