import { useEffect, useRef, useState } from 'react'
import type { ColumnDef } from './DataTable'

interface Props<T> {
  /** Columnas a listar en el menú. Las marcadas `alwaysVisible` aparecen pero deshabilitadas. */
  columns: ColumnDef<T>[]
  /** Set/array con los ids ocultos actualmente. */
  hiddenColumnIds: ReadonlySet<string> | string[]
  /** Callback al alternar visibilidad de una columna. */
  onToggle: (columnId: string) => void
  /** Texto del trigger. Default: "Columnas". */
  label?: string
  /** Texto del aria-label del menú. */
  menuLabel?: string
}

function ColumnsIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
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
 * Trigger + dropdown checklist para mostrar/ocultar columnas de un DataTable.
 * El consumidor mantiene el estado `hiddenColumnIds` y reacciona a `onToggle`.
 */
export function ColumnVisibilityMenu<T>({
  columns,
  hiddenColumnIds,
  onToggle,
  label = 'Columnas',
  menuLabel = 'Visibilidad de columnas',
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const hidden = hiddenColumnIds instanceof Set
    ? hiddenColumnIds
    : new Set(hiddenColumnIds ?? [])

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
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          'inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors',
          'bg-ui-card dark:bg-ui-dark-card text-text-primary dark:text-text-dark-primary',
          open
            ? 'border-odoo-teal/60 dark:border-odoo-dark-teal/60 bg-odoo-teal/8 dark:bg-odoo-dark-teal/15'
            : 'border-odoo-teal/30 dark:border-odoo-dark-teal/40 hover:bg-odoo-teal/8 dark:hover:bg-odoo-dark-teal/15 hover:border-odoo-teal/55 dark:hover:border-odoo-dark-teal/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-teal/35',
        ].join(' ')}
      >
        <span className="text-odoo-teal dark:text-odoo-dark-teal">
          <ColumnsIcon />
        </span>
        <span>{label}</span>
        <ChevronDownIcon open={open} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={menuLabel}
          className="absolute right-0 top-full mt-1 z-[210] min-w-[200px] py-1 bg-ui-card dark:bg-ui-dark-card border border-ui-border dark:border-ui-dark-border rounded-lg shadow-dropdown"
        >
          {columns.map((col) => {
            const id = col.id
            const isHidden = hidden.has(id)
            const isLocked = !!col.alwaysVisible
            const labelText = col.visibilityLabel ?? (typeof col.header === 'string' ? col.header : id)
            return (
              <label
                key={id}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer',
                  'hover:bg-ui-body dark:hover:bg-ui-dark-bg transition-colors',
                  isLocked ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={!isHidden}
                  disabled={isLocked}
                  onChange={() => !isLocked && onToggle(id)}
                  className="w-4 h-4 rounded border-ui-border dark:border-ui-dark-border text-odoo-purple focus:ring-odoo-purple/30"
                />
                <span className="text-text-primary dark:text-text-dark-primary">{labelText}</span>
              </label>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
