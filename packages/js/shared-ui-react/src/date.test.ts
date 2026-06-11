import { afterEach, describe, expect, it, vi } from 'vitest';
import { datetimeLocalToIso, toDatetimeLocalValue } from './date';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('toDatetimeLocalValue', () => {
  it('converts UTC ISO to local wall time for datetime-local', () => {
    vi.stubEnv('TZ', 'Europe/Madrid');
    // 2026-06-03 09:55 UTC → 11:55 CEST (UTC+2)
    expect(toDatetimeLocalValue('2026-06-03T09:55:00.000Z')).toBe('2026-06-03T11:55');
  });

  it('returns empty string for null/invalid', () => {
    expect(toDatetimeLocalValue(null)).toBe('');
    expect(toDatetimeLocalValue('invalid')).toBe('');
  });
});

describe('datetimeLocalToIso', () => {
  it('serializes local wall time to UTC ISO', () => {
    vi.stubEnv('TZ', 'Europe/Madrid');
    expect(datetimeLocalToIso('2026-06-03T11:55')).toBe('2026-06-03T09:55:00.000Z');
  });
});
