import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, LOCALE_ID, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { CONTACT } from '@core/contact';
import { filter } from 'rxjs';

/**
 * Design system SiteHeader + MobileMenu. Below 900px the CSS swaps the navigation for the
 * “Menú” button; the panel is a modal dialog, so focus is moved in, kept in and given back.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class Header {
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);

  readonly isAuthenticated = inject(AuthService).isAuthenticated;
  readonly contact = CONTACT;
  readonly mailto = `mailto:${CONTACT.email}`;
  readonly menuOpen = signal(false);

  /** Each locale is its own build under /es/ or /en/: switching is a full page load. */
  readonly otherLanguage = this.locale.startsWith('es')
    ? { subPath: 'en', lang: 'en', label: 'English' }
    : { subPath: 'es', lang: 'es', label: 'Español' };

  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  languageHref(): string {
    return `/${this.otherLanguage.subPath}${this.router.url}`;
  }

  openMenu(): void {
    this.menuOpen.set(true);
    document.body.style.overflow = 'hidden';
    // The panel is rendered by the next change detection; focus it once it exists.
    setTimeout(() => this.focusables()[0]?.focus());
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    document.body.style.overflow = '';
    this.menuButton()?.nativeElement.focus();
  }

  /** Keeps Tab inside the open panel. */
  trapFocus(event: KeyboardEvent): void {
    const focusables = this.focusables();
    if (event.key !== 'Tab' || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }

  private focusables(): HTMLElement[] {
    const panel = this.menuPanel()?.nativeElement;
    return panel ? Array.from(panel.querySelectorAll<HTMLElement>('a[href], button')) : [];
  }
}
