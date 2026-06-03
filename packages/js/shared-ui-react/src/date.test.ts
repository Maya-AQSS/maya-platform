import { describe, expect, it } from 'vitest';
import { datetimeLocalToIso, toDatetimeLocalValue } from './date';

describe('toDatetimeLocalValue', () => {
  it('converts UTC ISO to local wall time for datetime-local', () => {
    const prev = process.env.TZ;
    process.env.TZ = 'Europe/Madrid';
    try {
      // 2026-06-03 09:55 UTC → 11:55 CEST (UTC+2)
      expect(toDatetimeLocalValue('2026-06-03T09:55:00.000Z')).toBe('2026-06-03T11:55');
    } finally {
      if (prev === undefined) delete process.env.TZ;
      else process.env.TZ = prev;
    }
  });

  it('returns empty string for null/invalid', () => {
    expect(toDatetimeLocalValue(null)).toBe('');
    expect(toDatetimeLocalValue('invalid')).toBe('');
  });
});

describe('datetimeLocalToIso', () => {
  it('serializes local wall time to UTC ISO', () => {
    const prev = process.env.TZ;
    process.env.TZ = 'Europe/Madrid';
    try {
      expect(datetimeLocalToIso('2026-06-03T11:55')).toBe('2026-06-03T09:55:00.000Z');
    } finally {
      if (prev === undefined) delete process.env.TZ;
      else process.env.TZ = prev;
    }
  });
});
