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

  it('links to the same page in the other language', async () => {
    const { fixture, element } = render();
    await TestBed.inject(Router).navigateByUrl('/projects');
    fixture.detectChanges();

    const switcher = element.querySelector<HTMLAnchorElement>('.ag-nav a[lang]');
    expect(switcher?.getAttribute('href')).toBe('/es/projects');
  });
});
