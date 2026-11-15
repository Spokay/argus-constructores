import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AppConfigService } from './app-config.service';
import { BaseService } from './base.service';

export interface ChatMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

/** Temporary chat assistant. The server keeps nothing: every call sends the whole conversation. */
@Injectable({ providedIn: 'root' })
export class ChatService extends BaseService {
  protected readonly baseUrl = `${inject(AppConfigService).value.resourceServer.baseUrl}/chat`;

  ask(messages: ChatMessage[]): Observable<string> {
    return this.post<{ answer: string }>('', { messages }).pipe(map((response) => response.answer));
  }
}
