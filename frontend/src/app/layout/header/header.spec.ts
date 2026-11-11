import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { provideTestingEnvironment } from '../../../testing/test-providers';

import { Header } from './header';

@Component({ template: '' })
class Blank {}

describe('Header', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideTestingEnvironment(),
        provideRouter([{ path: 'projects', component: Blank }]),
      ],
    });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => (document.body.style.overflow = ''));

  it('opens the menu as a modal dialog and closes it on Escape, giving focus back', () => {
    const { fixture, element } = render();
    const menuButton = element.querySelector<HTMLButtonElement>('.ag-menu-btn')!;

    menuButton.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(menuButton);
    expect(document.body.style.overflow).toBe('');
  });

  it('lists both languages, linking to the same page, once the language button is clicked', async () => {
    const { fixture, element } = render();
    await TestBed.inject(Router).navigateByUrl('/projects');
    element.querySelector<HTMLButtonElement>('.ag-header-inner .lang-toggle')!.click();
    fixture.detectChanges();

    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.lang-list a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/es/projects',
      '/en/projects',
    ]);
    // Tests run with Angular's default LOCALE_ID, en-US.
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([null, 'true']);
  });

  it('closes the language list on Escape and on a click outside it', () => {
    const { fixture, element } = render();
    const toggle = element.querySelector<HTMLButtonElement>('.ag-header-inner .lang-toggle')!;

    toggle.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(element.querySelector('.lang-list')).toBeNull();

    toggle.click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(element.querySelector('.lang-list')).toBeNull();
  });
});
