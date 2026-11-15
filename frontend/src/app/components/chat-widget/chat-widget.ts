import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  LOCALE_ID,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ChatMessage, ChatService } from '@core/chat.service';

/** The constructor lib.dom does not declare; Chrome and Safari still ship it prefixed. */
interface Recognizer {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognizerConstructor = new () => Recognizer;

/**
 * Jaime's voice per dictation language: the same Spanish voice in both, so English answers keep
 * a Spanish accent. A browser without it falls back to its default voice for the language.
 */
const VOICES = {
  'es-CO': { name: 'Google español', rate: 1, pitch: 1.2 },
  'en-US': { name: 'Google español', rate: 1, pitch: 1.3 },
} as const;

/**
 * Temporary chat assistant for the presentation: a launcher fixed bottom right opening a panel.
 * The microphone uses the browser's Web Speech API (no Firefox support: the button is hidden
 * there), and an answer to a spoken question is read aloud. Dictation cannot detect the spoken
 * language, so the visitor picks it, starting from the page's locale; typed questions need no choice.
 */
@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
  host: { '(document:keydown.escape)': 'close()' },
})
export class ChatWidget {
  private readonly chatService = inject(ChatService);
  private readonly Recognition = speechRecognition();
  private recognizer?: Recognizer;

  readonly open = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly listening = signal(false);
  readonly error = signal<string | null>(null);
  readonly voiceLanguage = signal<'en-US' | 'es-CO'>(
    inject(LOCALE_ID).startsWith('es') ? 'es-CO' : 'en-US',
  );
  readonly canListen = this.Recognition !== undefined;

  private readonly launcher = viewChild.required<ElementRef<HTMLButtonElement>>('launcher');
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly messageList = viewChild<ElementRef<HTMLElement>>('messageList');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopVoice());
  }

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.open.set(true);
      // The panel is rendered by the next change detection; focus it once it exists.
      setTimeout(() => this.input()?.nativeElement.focus());
    }
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.stopVoice();
    this.launcher().nativeElement.focus();
  }

  send(spoken = false): void {
    const question = this.draft().trim();
    if (!question || this.sending()) return;
    const conversation: ChatMessage[] = [...this.messages(), { role: 'USER', content: question }];
    this.messages.set(conversation);
    this.draft.set('');
    this.error.set(null);
    this.sending.set(true);
    this.scrollToEnd();
    this.chatService.ask(conversation).subscribe({
      next: (answer) => {
        this.messages.update((messages) => [...messages, { role: 'ASSISTANT', content: answer }]);
        this.sending.set(false);
        this.scrollToEnd();
        if (spoken) this.speak(answer);
      },
      error: (error: HttpErrorResponse) => {
        this.sending.set(false);
        this.error.set(chatError(error.status));
      },
    });
  }

  toggleVoiceLanguage(): void {
    this.voiceLanguage.update((language) => (language === 'en-US' ? 'es-CO' : 'en-US'));
  }

  toggleListening(): void {
    if (this.listening()) {
      this.recognizer?.stop();
      return;
    }
    if (!this.Recognition) return;
    speechSynthesis.cancel();
    const recognizer = new this.Recognition();
    recognizer.lang = this.voiceLanguage();
    recognizer.interimResults = true;
    let final = false;
    recognizer.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      this.draft.set(Array.from(event.results, (r) => r[0].transcript).join(''));
      final = result.isFinal;
    };
    recognizer.onend = () => {
      this.listening.set(false);
      if (final) this.send(true);
    };
    this.recognizer = recognizer;
    this.listening.set(true);
    recognizer.start();
  }

  private speak(text: string): void {
    const settings = VOICES[this.voiceLanguage()];
    const voice = speechSynthesis.getVoices().find((v) => v.name === settings.name);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice ?? null;
    // The answer is in the language of the spoken question.
    utterance.lang = voice?.lang ?? this.voiceLanguage();
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    speechSynthesis.speak(utterance);
  }

  private stopVoice(): void {
    this.recognizer?.stop();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  private scrollToEnd(): void {
    setTimeout(() => {
      const list = this.messageList()?.nativeElement;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }
}

function speechRecognition(): RecognizerConstructor | undefined {
  const speechWindow = window as unknown as {
    SpeechRecognition?: RecognizerConstructor;
    webkitSpeechRecognition?: RecognizerConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function chatError(status: number): string {
  if (status === 429)
    return $localize`:@@chat.busy:Error: demasiadas preguntas en este momento. Intente de nuevo en un minuto.`;
  return $localize`:@@chat.failed:Error: el asistente no está disponible. Intente de nuevo.`;
}
