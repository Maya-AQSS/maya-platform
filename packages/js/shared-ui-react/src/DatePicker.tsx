import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  /** Valor actual en formato ISO `YYYY-MM-DD` (o `null`/`''`). */
  value: string | null | undefined
  /** Callback al seleccionar una fecha (ISO string) o `null` al limpiar. */
  onChange: (date: string | null) => void
  /** Placeholder. */
  placeholder?: string
  /** Etiqueta accesible. */
  ariaLabel?: string
  /** Clase extra para el contenedor. */
  className?: string
  /** Deshabilitado. */
  disabled?: boolean
  /** Fecha mínima permitida (ISO). */
  min?: string
  /** Fecha máxima permitida (ISO). */
  max?: string
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

const DAYS_OF_WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] // lunes-first

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const SHORT_MONTH_NAMES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function pad2(n: number) { return n < 10 ? `0${n}` : String(n) }

function toIso(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`
}

function parseIso(s: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) }
}

function formatDisplay(s: string | null | undefined): string {
  const p = parseIso(s)
  if (!p) return ''
  return `${p.day} ${SHORT_MONTH_NAMES[p.month]} ${p.year}`
}

/** Days in month (0-indexed month). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Day of week for the 1st (0=Sun → adjusted to Mon-first: 0=Mon). */
function firstDayOffset(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay() // 0=Sun
  return d === 0 ? 6 : d - 1
}

function isToday(y: number, m: number, d: number): boolean {
  const now = new Date()
  return now.getFullYear() === y && now.getMonth() === m && now.getDate() === d
}

/* ─── Component ────────────────────────────────────────────────────── */

/**
 * DatePicker con calendario desplegable estilo Material 3.
 *
 * - Calendario grid con navegación mes/año
 * - Día de hoy marcado con anillo
 * - Día seleccionado con fondo sólido
 * - Cierra al seleccionar fecha, click fuera, o Escape
 * - Input manual via texto (fallback: input nativo date en mobile)
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  ariaLabel,
  className = '',
  disabled = false,
  min,
  max,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const parsed = parseIso(value)
  const today = useMemo(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth(), day: n.getDate() }
  }, [])

  // Calendar view state (which month/year is shown).
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.year)
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month)

  // Sync view to value when it changes externally.
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year)
      setViewMonth(parsed.month)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  /* ── Navigation ─────────────────────────────────────────────────── */

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function selectDay(day: number) {
    const iso = toIso(viewYear, viewMonth, day)
    onChange(iso)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
  }

  /* ── Calendar grid ──────────────────────────────────────────────── */

  const offset = firstDayOffset(viewYear, viewMonth)
  const totalDays = daysInMonth(viewYear, viewMonth)
  const cells: (number | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  // Is a specific date disabled by min/max?
  function isDayDisabled(day: number): boolean {
    const iso = toIso(viewYear, viewMonth, day)
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  /* ── Render ─────────────────────────────────────────────────────── */

  const displayText = formatDisplay(value)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) {
            setOpen((v) => !v)
            // Reset view to selected date or today when opening.
            if (!open) {
              setViewYear(parsed?.year ?? today.year)
              setViewMonth(parsed?.month ?? today.month)
            }
          }
        }}
        className={[
          'w-full flex items-center justify-between gap-2',
          'bg-ui-card dark:bg-ui-dark-card border rounded-md',
          'text-text-primary dark:text-text-dark-primary px-3 py-2 text-sm text-left',
          'outline-none transition-colors',
          open
            ? 'border-odoo-purple dark:border-odoo-dark-purple'
            : 'border-ui-border dark:border-ui-dark-border',
          'focus:border-odoo-purple dark:focus:border-odoo-dark-purple',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className={displayText ? '' : 'text-text-muted dark:text-text-dark-muted'}>
          {displayText || placeholder}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Clear button */}
          {value && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(null) } }}
              className="p-0.5 rounded hover:bg-ui-body dark:hover:bg-ui-dark-bg text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
              aria-label="Limpiar fecha"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          ) : null}
          {/* Calendar icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary dark:text-text-dark-secondary"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Calendario"
          className={[
            'absolute z-50 mt-1 w-[300px] rounded-xl border shadow-lg',
            'border-ui-border dark:border-ui-dark-border',
            'bg-ui-card dark:bg-ui-dark-card',
            'overflow-hidden select-none',
          ].join(' ')}
        >
          {/* Header: selected date display */}
          {parsed ? (
            <div className="px-4 pt-3 pb-2 border-b border-ui-border-l/50 dark:border-ui-dark-border-l/50">
              <p className="text-xs text-text-muted dark:text-text-dark-muted uppercase tracking-wide">Fecha seleccionada</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-dark-primary mt-0.5">
                {parsed.day} de {MONTH_NAMES[parsed.month]} {parsed.year}
              </p>
            </div>
          ) : null}

          {/* Month/Year navigation */}
          <div className="flex items-center justify-between px-3 py-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-ui-body dark:hover:bg-ui-dark-bg text-text-secondary dark:text-text-dark-secondary transition-colors"
              aria-label="Mes anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-ui-body dark:hover:bg-ui-dark-bg text-text-secondary dark:text-text-dark-secondary transition-colors"
              aria-label="Mes siguiente"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-3">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-xs font-semibold text-text-muted dark:text-text-dark-muted uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-3 pb-3">
            {cells.map((day, i) => {
              if (day == null) {
                return <div key={`e-${i}`} className="h-9" />
              }
              const iso = toIso(viewYear, viewMonth, day)
              const isSelected = value === iso
              const isTodayDay = isToday(viewYear, viewMonth, day)
              const isDisabled = isDayDisabled(day)
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={[
                    'h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm transition-colors',
                    isSelected
                      ? 'bg-odoo-purple dark:bg-odoo-dark-purple text-white font-semibold'
                      : isTodayDay
                        ? 'ring-1 ring-odoo-purple/60 dark:ring-odoo-dark-purple/60 text-odoo-purple dark:text-odoo-dark-purple font-semibold hover:bg-odoo-purple/10 dark:hover:bg-odoo-dark-purple/15'
                        : isDisabled
                          ? 'text-text-muted/40 dark:text-text-dark-muted/40 cursor-not-allowed'
                          : 'text-text-primary dark:text-text-dark-primary hover:bg-odoo-purple/10 dark:hover:bg-odoo-dark-purple/15',
                  ].join(' ')}
                  aria-label={`${day} de ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
