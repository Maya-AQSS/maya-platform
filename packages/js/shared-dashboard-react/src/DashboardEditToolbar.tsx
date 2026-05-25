import { useEffect, useRef, useState } from 'react'
import type { LayoutItem, WidgetRegistry } from './types'

interface Props {
  /** Layout actual (para saber qué widgets ya están añadidos). */
  layout: LayoutItem[]
  /** Catálogo completo de widgets disponibles. */
  registry: WidgetRegistry
  /** Función i18n del consumidor — resuelve `titleKey` de cada widget. */
  t: (key: string) => string
  onSave: () => void
  onCancel: () => void
  onReset: () => void
  onAddWidget: (widgetId: string) => void
  /** Etiquetas opcionales (default en español). */
  labels?: {
    save?: string
    cancel?: string
    reset?: string
    addWidget?: string
  }
}

/**
 * Submenú de edición compartido por las 4 apps Maya. Diseñado para
 * renderizarse dentro del slot `actions` de `<PageTitle>`, reemplazando
 * al `DashboardEditToggleButton` durante el modo edición.
 *
 * Botones con altura h-9 y forma rounded-full para coincidir con
 * `DashboardEditToggleButton`.
 */
export function DashboardEditToolbar({
  layout,
  registry,
  t,
  onSave,
  onCancel,
  onReset,
  onAddWidget,
  labels,
}: Props) {
  const defaultLabels = {
    save: t('actions.save'),
    cancel: t('actions.cancel'),
    reset: t('actions.reset'),
    addWidget: t('dashboard.addWidget'),
  }
  const L = { ...defaultLabels, ...(labels ?? {}) }
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const existingIds = new Set(layout.map((item) => item.i))
  const availableToAdd = Object.values(registry).filter((def) => !existingIds.has(def.id))

  const baseBtn = [
    // rounded-md igual que el resto de botones de la app (Button.tsx).
    'inline-flex items-center justify-center h-9 px-4 rounded-md',
    'text-sm font-semibold tracking-wide',
    'shadow-[0_2px_6px_-2px_rgba(113,75,103,0.35)] hover:shadow-[0_6px_14px_-6px_rgba(113,75,103,0.45)]',
    'transition-all motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/40',
  ].join(' ')

  // Verde sólido: acción positiva (guardar).
  const primaryBtn = `${baseBtn} bg-success hover:bg-success-dark text-text-inverse border border-success-dark dark:border-success`
  // Neutro ghost: cancelar (descartar sin perder datos).
  const cancelBtn = `${baseBtn} bg-transparent border border-ui-border dark:border-ui-dark-border text-text-secondary dark:text-text-dark-secondary hover:bg-ui-body dark:hover:bg-ui-dark-bg hover:text-text-primary dark:hover:text-text-dark-primary`
  // Outline warning: restablecer (acción destructiva del layout).
  const resetBtn = `${baseBtn} bg-warning-light dark:bg-warning-dark/20 border border-warning/50 dark:border-warning/60 text-warning-dark dark:text-warning hover:bg-warning/20 dark:hover:bg-warning-dark/40`
  // Purple primary: acento (añadir widget).
  const accentBtn = `${baseBtn} bg-gradient-primary bg-gradient-primary-hover text-text-inverse border border-odoo-purple-d dark:border-odoo-dark-purple disabled:opacity-50 disabled:cursor-not-allowed`

  return (
    // `mr-4` alinea el grupo con el borde derecho del bloque de widgets
    // (react-grid-layout aplica containerPadding = margin = 16px).
    <div className="flex items-center gap-2 flex-wrap justify-end mr-4">
      <button type="button" onClick={onSave} className={primaryBtn} title={L.save}>
        {L.save}
      </button>
      <button type="button" onClick={onCancel} className={cancelBtn} title={L.cancel}>
        {L.cancel}
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          disabled={availableToAdd.length === 0}
          className={accentBtn}
          title={L.addWidget}
        >
          + {L.addWidget}
        </button>
        {dropdownOpen && availableToAdd.length > 0 && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 z-[300] min-w-[200px] bg-ui-card dark:bg-ui-dark-card border border-ui-border dark:border-ui-dark-border rounded-xl shadow-lg overflow-hidden"
          >
            {availableToAdd.map((def) => (
              <button
                key={def.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onAddWidget(def.id)
                  setDropdownOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-text-dark-primary hover:bg-ui-body dark:hover:bg-ui-dark-bg transition"
              >
                {t(def.titleKey)}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" onClick={onReset} className={resetBtn} title={L.reset}>
        {L.reset}
      </button>
    </div>
  )
}
