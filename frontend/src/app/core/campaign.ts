import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * Temporary marketing campaign: the banner above the header and the /campaign page.
 * Changing the date or starting a new campaign is a redeploy. Give a new campaign a new `id`,
 * so visitors who closed the previous banner see this one.
 */
export const CAMPAIGN = {
  id: 'campaign-2026-12',
  /** The campaign's name, the same in every language: not translated. */
  title: 'Every scar builds a story',
  // Bogotá time, explicitly: a bare date would be read in the visitor's time zone.
  endsAt: new Date('2026-12-20T23:59:59-05:00'),
};

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** What remains until `endsAt`, or `null` once it has passed. */
export function timeLeft(endsAt: Date, now: number): TimeLeft | null {
  const totalSeconds = Math.floor((endsAt.getTime() - now) / 1000);
  if (totalSeconds <= 0) return null;
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** The current time, refreshed every second while the calling component lives. */
export function ticker(): Signal<number> {
  const now = signal(Date.now());
  const id = setInterval(() => now.set(Date.now()), 1000);
  inject(DestroyRef).onDestroy(() => clearInterval(id));
  return now.asReadonly();
}

export function pad(value: number): string {
  return String(value).padStart(2, '0');
}
