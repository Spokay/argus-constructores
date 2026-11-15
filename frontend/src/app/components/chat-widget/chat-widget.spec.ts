import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideTestingEnvironment } from '../../../testing/test-providers';

import { ChatWidget } from './chat-widget';

describe('ChatWidget', () => {
  function render(locale = 'en') {
    TestBed.configureTestingModule({
      imports: [ChatWidget],
      providers: [
        provideTestingEnvironment(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: locale },
      ],
    });
    const fixture = TestBed.createComponent(ChatWidget);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const launcher = element.querySelector<HTMLButtonElement>('.chat-launcher')!;
    const ask = (question: string) => {
      const input = element.querySelector<HTMLInputElement>('.chat-form input')!;
      input.value = question;
      input.dispatchEvent(new Event('input'));
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    };
    return { fixture, element, launcher, ask, http: TestBed.inject(HttpTestingController) };
  }

  it('opens and closes the panel from the launcher', () => {
    const { fixture, element, launcher } = render();
    expect(element.querySelector('.chat-panel')).toBeNull();

    launcher.click();
    fixture.detectChanges();
    expect(element.querySelector('.chat-panel')).not.toBeNull();
    expect(launcher.getAttribute('aria-expanded')).toBe('true');

    element.querySelector<HTMLButtonElement>('.chat-close')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.chat-panel')).toBeNull();
  });

  it('sends the whole conversation and shows each answer', () => {
    const { fixture, element, launcher, ask, http } = render();
    launcher.click();
    fixture.detectChanges();

    ask('¿Dónde están?');
    http.expectOne('/api/chat').flush({ answer: 'En Bogotá.' });
    fixture.detectChanges();

    ask('¿Y el teléfono?');
    const second = http.expectOne('/api/chat');
    expect(second.request.body).toEqual({
      messages: [
        { role: 'USER', content: '¿Dónde están?' },
        { role: 'ASSISTANT', content: 'En Bogotá.' },
        { role: 'USER', content: '¿Y el teléfono?' },
      ],
    });
    second.flush({ answer: '311 276 1700.' });
    fixture.detectChanges();

    const messages = Array.from(element.querySelectorAll('.chat-message'), (m) =>
      m.textContent!.trim(),
    );
    expect(messages.slice(1)).toEqual([
      '¿Dónde están?',
      'En Bogotá.',
      '¿Y el teléfono?',
      '311 276 1700.',
    ]);
  });

  it('dictates in Spanish on the Spanish site', () => {
    const { fixture } = render('es-CO');
    expect(fixture.componentInstance.voiceLanguage()).toBe('es-CO');
  });

  it('dictates in English on the English site and switches to Spanish', () => {
    const { fixture, element, launcher } = render();
    launcher.click();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.voiceLanguage()).toBe('en-US');

    component.toggleVoiceLanguage();
    fixture.detectChanges();
    expect(component.voiceLanguage()).toBe('es-CO');
    if (component.canListen) {
      expect(element.querySelector('.chat-form')!.textContent).toContain('ES');
    }
  });

  it("reads the answer to a spoken question with Jaime's voice", () => {
    const { fixture, http } = render();
    const voice = { name: 'Google español', lang: 'es-ES' } as SpeechSynthesisVoice;
    spyOn(speechSynthesis, 'getVoices').and.returnValue([voice]);
    // A real utterance only accepts voices the browser created; the headless one has none.
    spyOn(window, 'SpeechSynthesisUtterance').and.callFake(
      class {
        constructor(readonly text: string) {}
      } as unknown as (text?: string) => SpeechSynthesisUtterance,
    );
    const speak = spyOn(speechSynthesis, 'speak');

    fixture.componentInstance.draft.set('Hello');
    fixture.componentInstance.send(true);
    http.expectOne('/api/chat').flush({ answer: 'Hi.' });

    const utterance = speak.calls.mostRecent().args[0];
    expect(utterance.text).toBe('Hi.');
    expect(utterance.voice).toBe(voice);
    expect(utterance.lang).toBe('es-ES');
    expect(utterance.pitch).toBeCloseTo(1.3);
  });

  it('starts the error with “Error:” when the assistant is busy', () => {
    const { fixture, element, launcher, ask, http } = render();
    launcher.click();
    fixture.detectChanges();

    ask('Hola');
    http.expectOne('/api/chat').flush(null, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')!.textContent).toMatch(
      /^\s*Error: demasiadas preguntas/,
    );
  });
});
