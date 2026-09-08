import { describe, it, expect } from 'vitest';

// Pure function extracted to test availability window logic
function getStatus(from: Date | null, until: Date | null, now: Date): 'open' | 'upcoming' | 'closed' {
  if (!from && !until) return 'open';
  if (from && now < from) return 'upcoming';
  if (until && now > until) return 'closed';
  return 'open';
}

describe('availability window', () => {
  it('is open when no window set', () => {
    expect(getStatus(null, null, new Date())).toBe('open');
  });

  it('is upcoming when before availableFrom', () => {
    const future = new Date(Date.now() + 1_000_000);
    expect(getStatus(future, null, new Date())).toBe('upcoming');
  });

  it('is closed when after availableUntil', () => {
    const past = new Date(Date.now() - 1_000_000);
    expect(getStatus(null, past, new Date())).toBe('closed');
  });

  it('is open when within window', () => {
    const past = new Date(Date.now() - 1_000_000);
    const future = new Date(Date.now() + 1_000_000);
    expect(getStatus(past, future, new Date())).toBe('open');
  });

  it('is open when only availableFrom is set and passed', () => {
    const past = new Date(Date.now() - 1_000_000);
    expect(getStatus(past, null, new Date())).toBe('open');
  });
});
