import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  /** Contenido del popover (inputs/selects/checkbox del filtro). */
  children: ReactNode
  /** Nº de filtros activos a mostrar como badge. 0 = sin badge. */
  activeCount?: number
  /** Etiqueta del botón. Default: "Filtros". */
  label?: string
  /** Si los filtros no aplican (p. ej. tabla vacía), deshabilita el botón. */
  disabled?: boolean
  /** Ancho mínimo del popover (default 280px). */
  minWidth?: number
  /** Callback opcional al limpiar filtros (renderiza un botón "Limpiar" en el footer). */
  onClear?: () => void
  /** Texto del botón "Limpiar". Default: "Limpiar". */
  clearLabel?: string
}

function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/**
 * Botón "Filtros" con popover. Las páginas pasan sus inputs/selects como children.
 * Si `activeCount > 0`, muestra un badge con el número de filtros activos.
 *
 *   <FiltersButton activeCount={search ? 1 : 0} onClear={() => setSearch('')}>
 *     <input value={search} onChange={...} />
 *     <select ...>...</select>
 *   </FiltersButton>
 */
export function FiltersButton({
  children,
  activeCount = 0,
  label = 'Filtros',
  disabled = false,
  minWidth = 280,
  onClear,
  clearLabel = 'Limpiar',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        className={[
          'inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors',
          'border-ui-border dark:border-ui-dark-border bg-ui-card dark:bg-ui-dark-card',
          'text-text-primary dark:text-text-dark-primary',
          'hover:bg-odoo-purple/5 dark:hover:bg-odoo-dark-purple/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
          'disabled:pointer-events-none disabled:bg-text-muted/10 dark:disabled:bg-text-dark-muted/10',
          'disabled:text-text-secondary dark:disabled:text-text-dark-secondary disabled:border-text-muted/30',
        ].join(' ')}
      >
        <span className="text-text-secondary dark:text-text-dark-secondary">
          <FilterIcon />
        </span>
        <span>{label}</span>
        {activeCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-xs font-bold rounded-full bg-gradient-primary text-text-inverse">
            {activeCount}
          </span>
        ) : null}
        <ChevronDownIcon open={open} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 top-full mt-1 z-[210] bg-ui-card dark:bg-ui-dark-card border border-ui-border dark:border-ui-dark-border rounded-lg shadow-dropdown"
          style={{ minWidth }}
        >
          <div className="p-3 flex flex-col gap-3">{children}</div>
          {onClear ? (
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-ui-border-l dark:border-ui-dark-border-l">
              <button
                type="button"
                onClick={() => {
                  onClear()
                }}
                disabled={activeCount === 0}
                className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary disabled:text-text-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {clearLabel}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
