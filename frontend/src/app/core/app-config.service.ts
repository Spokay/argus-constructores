import { Injectable } from '@angular/core';
import type { LogLevel } from '@shared/logger.service';

import { environment } from '../../environments/environment';

export interface AppConfig {
  resourceServer: {
    /**
     * Where the app calls the API — not the server's origin. `/api` behind the dev proxy,
     * and the server's URL including its context path without it. Services read this, and
     * `authInterceptor` only attaches the token to URLs under it.
     */
    baseUrl: string;
  };
  /**
   * Optional so a hand-edited config that predates it still loads; `LoggerService` falls back
   * to `debug` in development and `warn` in production when it is absent.
   *
   * The type is imported for its type only — `LoggerService` reads this interface at runtime,
   * and a value import in both directions would be a module cycle.
   */
  logging?: {
    level?: LogLevel;
  };
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config!: AppConfig;

  get value(): AppConfig {
    return this.config;
  }

  async load(): Promise<void> {
    const configPath = environment.configPath;
    const res = await fetch(configPath, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to load config from ${configPath}: ${res.status} ${res.statusText}`);
    }
    this.config = await res.json();
  }
}
