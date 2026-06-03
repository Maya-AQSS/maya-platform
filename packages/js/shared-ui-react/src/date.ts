/**
 * Intl-based date helpers. All display formatters interpret ISO/UTC instants in the
 * user's local timezone (browser). Pass a BCP-47 tag (e.g. from `useLocale().dateLocale`)
 * for language-specific month names and ordering.
 */

const DEFAULT_LOCALE = 'es-ES';

const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = dateTimeFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    dateTimeFormatterCache.set(locale, formatter);
  }
  return formatter;
}

function getDateFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = dateFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    dateFormatterCache.set(locale, formatter);
  }
  return formatter;
}

function parseInstant(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(
  value: string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  const d = parseInstant(value);
  if (!d) return '-';
  return getDateTimeFormatter(locale).format(d);
}

export function formatDate(
  value: string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  const d = parseInstant(value);
  if (!d) return '-';
  return getDateFormatter(locale).format(d);
}

/**
 * Value for `<input type="datetime-local" />` from an ISO instant (UTC-safe).
 */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  const d = parseInstant(iso);
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * ISO instant from a `datetime-local` string (interpreted as local wall time).
 */
export function datetimeLocalToIso(local: string): string | null {
  if (!local.trim()) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
