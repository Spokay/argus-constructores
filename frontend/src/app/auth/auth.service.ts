import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AppConfigService } from '@core/app-config.service';
import { Observable, map, tap } from 'rxjs';

/** What `POST /auth/login` returns. */
interface TokenResponse {
  accessToken: string;
  expiresAt: string;
}

interface Session extends TokenResponse {
  username: string;
}

const STORAGE_KEY = 'argus.session';

/**
 * Holds the admin's JWT. It lives in localStorage so a reload or a new tab keeps the session;
 * the server's `exp` claim, mirrored in `expiresAt`, is what ends it.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  private readonly session = signal<Session | null>(readStoredSession());

  readonly username = computed(() => this.session()?.username ?? null);

  /** Re-evaluated when the session changes, not as time passes: an expired token is caught by `token()` or a 401. */
  readonly isAuthenticated = computed(() => isValid(this.session()));

  login(username: string, password: string): Observable<void> {
    const url = `${this.appConfig.value.resourceServer.baseUrl}/auth/login`;
    return this.http.post<TokenResponse>(url, { username, password }).pipe(
      tap((response) => this.store({ ...response, username })),
      map(() => undefined),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  /** The bearer token, or null when there is none or it has expired. */
  token(): string | null {
    const session = this.session();
    return isValid(session) ? session.accessToken : null;
  }

  private store(session: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }
}

function isValid(session: Session | null): session is Session {
  return session !== null && Date.parse(session.expiresAt) > Date.now();
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    // A hand-edited or corrupted entry is treated as logged out rather than breaking startup.
    return null;
  }
}
