import { timeLeft } from './campaign';

describe('timeLeft', () => {
  const endsAt = new Date('2026-12-15T23:59:59-05:00');

  it('splits the remaining time into days, hours, minutes and seconds', () => {
    const now = endsAt.getTime() - ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
    expect(timeLeft(endsAt, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it('is null at the deadline and after it', () => {
    expect(timeLeft(endsAt, endsAt.getTime())).toBeNull();
    expect(timeLeft(endsAt, endsAt.getTime() + 1000)).toBeNull();
  });
});
