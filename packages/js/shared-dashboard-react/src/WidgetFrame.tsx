import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface WidgetFrameProps {
  title?: string
  hideTitle?: boolean
  editable?: boolean
  onRemove?: () => void
  removeAriaLabel?: string
  /**
   * Realza el widget con borde gradiente diagonal (purple → teal).
   * Pensado para KPI hero del dashboard. Usar con moderación: 1-2 widgets
   * destacados por pantalla, el resto queda con el frame estándar.
   */
  highlight?: boolean
  /**
   * Si true, el frame deja crecer su contenido fuera del card. Pensado para
   * widgets con decoraciones flotantes (megáfono asomando, badges sobresalidos).
   * Mantén siempre el card relativo: las decoraciones se posicionan absolute.
   */
  allowOverflow?: boolean
  /** Si true, el contenedor de children no aplica padding interno. */
  bleed?: boolean
  children?: ReactNode
}

/**
 * Marco visual común para los widgets del dashboard: card con bordes
 * redondeados, opcional barra de título, opcional botón de eliminar
 * (solo visible en modo edit).
 *
 * En modo edit:
 * - Toda la card actúa como drag-handle (clase `widget-drag-handle`),
 *   excepto el botón de eliminar y el handle de resize de
 *   `react-grid-layout` (`.react-resizable-handle`).
 * - El contenido del widget queda bloqueado a interacciones
 *   (`pointer-events-none`) para que el usuario solo pueda
 *   arrastrar/redimensionar.
 */
export function WidgetFrame({
  title,
  hideTitle = false,
  editable = false,
  onRemove,
  removeAriaLabel,
  highlight = false,
  allowOverflow = false,
  bleed = false,
  children,
}: WidgetFrameProps) {
  const { t } = useTranslation('common')
  const resolvedRemoveAriaLabel =
    removeAriaLabel ?? t('dashboard.removeWidget', { defaultValue: 'Remove widget' })
  const showRemove = editable && typeof onRemove === 'function'
  // Surface premium: glassmorphism (con fallback automático via @media reduced-transparency)
  // + sombra extendida con tinte morado + hover lift sutil en modo lectura.
  // En modo edit no se aplica el lift para no competir con el drag.
  // En modo highlight, sustituye el borde plano por gradiente diagonal.
  const baseSurface = highlight
    ? 'border-glow-glass shadow-card-glass'
    : 'bg-card-glass shadow-card-glass border border-ui-border/70 dark:border-ui-dark-border/70'
  const frameClasses = [
    'relative h-full flex flex-col rounded-2xl',
    allowOverflow ? 'overflow-visible' : 'overflow-hidden',
    baseSurface,
    editable
      ? 'widget-drag-handle cursor-grab active:cursor-grabbing'
      : 'motion-safe:transition-all motion-safe:duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-card-md',
    !editable && !highlight
      ? 'hover:border-odoo-purple/30 dark:hover:border-odoo-dark-purple/40'
      : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    <div className={frameClasses}>
      {!hideTitle && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-ui-border-l dark:border-ui-dark-border">
          <span className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
            {title}
          </span>
          {showRemove && (
            <button
              type="button"
              onClick={onRemove}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label={resolvedRemoveAriaLabel}
              className="ml-2 shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      )}
      {hideTitle && showRemove && (
        <button
          type="button"
          onClick={onRemove}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={resolvedRemoveAriaLabel}
          className="absolute top-1 right-1 z-20 inline-flex items-center justify-center w-6 h-6 rounded-md text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors text-lg leading-none cursor-pointer bg-ui-card/80 dark:bg-ui-dark-card/80 backdrop-blur"
        >
          ×
        </button>
      )}
      <div
        className={[
          'flex-1',
          allowOverflow ? 'overflow-visible' : 'overflow-auto',
          bleed ? '' : 'p-3',
          editable ? 'pointer-events-none select-none' : '',
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
