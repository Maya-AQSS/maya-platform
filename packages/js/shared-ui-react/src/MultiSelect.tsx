import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MultiSelectOption {
  value: string
  label: ReactNode
}

interface Props {
  /** Opciones disponibles. */
  options: MultiSelectOption[]
  /** Valores seleccionados (controlled). */
  value: string[]
  /** Callback al cambiar la selección. */
  onChange: (next: string[]) => void
  /** Placeholder cuando no hay nada seleccionado. */
  placeholder?: string
  /** Etiqueta accesible. */
  ariaLabel?: string
  /** Clase extra para el trigger. */
  className?: string
  /** Deshabilitado. */
  disabled?: boolean
}

/**
 * Multi-select con dropdown de checkboxes. Estilo Maya — dropdown con opciones
 * que se marcan/desmarcan sin cerrar el panel.
 *
 * Inspirado en el patrón "Phase access / Choose phases" con checkboxes.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  ariaLabel,
  className = '',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera.
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

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const selectedSet = new Set(value)

  function toggle(optValue: string) {
    if (selectedSet.has(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  // Build display text.
  const displayText =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? options
            .filter((o) => selectedSet.has(o.value))
            .map((o) => (typeof o.label === 'string' ? o.label : o.value))
            .join(', ')
        : `${value.length} seleccionados`

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
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
        <span className={value.length === 0 ? 'text-text-muted dark:text-text-dark-muted' : ''}>
          {displayText}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-150 text-text-secondary dark:text-text-dark-secondary ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className={[
            'absolute z-50 mt-1 w-full rounded-md border shadow-lg',
            'border-ui-border dark:border-ui-dark-border',
            'bg-ui-card dark:bg-ui-dark-card',
            'max-h-60 overflow-y-auto',
          ].join(' ')}
        >
          {options.map((opt) => {
            const checked = selectedSet.has(opt.value)
            return (
              <label
                key={opt.value}
                role="option"
                aria-selected={checked}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm',
                  'text-text-primary dark:text-text-dark-primary',
                  'border-b last:border-0 border-ui-border-l/50 dark:border-ui-dark-border-l/50',
                  'hover:bg-ui-body/60 dark:hover:bg-ui-dark-bg/40',
                  'transition-colors',
                  checked ? 'bg-odoo-purple/5 dark:bg-odoo-dark-purple/10' : '',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="w-4 h-4 accent-odoo-purple flex-shrink-0 cursor-pointer"
                />
                <span>{opt.label}</span>
              </label>
            )
          })}
          {options.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-text-muted dark:text-text-dark-muted">
              Sin opciones
            </div>
          )}
        </div>
      )}
    </div>
  )
}
