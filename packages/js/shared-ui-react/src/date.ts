/**
 * Intl-based date formatters in `es-ES`. Shared by maya_audit and maya_logs
 * (and any future Maya frontend that needs the same long-form Spanish
 * presentation).
 */

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return DATE_TIME_FORMATTER.format(d);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return DATE_FORMATTER.format(d);
}
