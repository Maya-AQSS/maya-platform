import { useCallback } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import { WidgetFrame } from './WidgetFrame'
import type { LayoutItem, WidgetRegistry } from './types'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }

interface WidgetGridProps {
  /** Definiciones de widgets disponibles. */
  registry: WidgetRegistry
  /** Layout actual (posición/tamaño de cada widget). */
  layout: LayoutItem[]
  /** Callback al cambiar el layout (drag/resize). */
  onLayoutChange: (next: LayoutItem[]) => void
  /** Modo edición — habilita drag y resize. */
  editable: boolean
  /** Callback al eliminar un widget. */
  onRemoveWidget: (widgetId: string) => void
  /** Función i18n del consumidor — usada para resolver `titleKey` y mensajes. */
  t: (key: string) => string
  /** Mensaje cuando no hay widgets visibles. */
  emptyKey?: string
  /** Aria label del botón eliminar de cada widget. */
  removeAriaLabel?: string
}

/**
 * Rejilla responsive con drag-and-drop sobre `react-grid-layout`. Renderiza
 * cada widget de `layout` resolviendo su componente desde `registry`.
 *
 * El consumidor mantiene el estado del layout (`layout` + `onLayoutChange`) y
 * la persistencia (localStorage, backend, etc.).
 */
export function WidgetGrid({
  registry,
  layout,
  onLayoutChange,
  editable,
  onRemoveWidget,
  t,
  emptyKey = 'dashboard.noWidgets',
  removeAriaLabel,
}: WidgetGridProps) {
  // Widgets pueden redimensionarse libremente: minW/minH del layout/registry
  // se ignoran para permitir tamaños arbitrarios.
  const validItems = layout
    .filter((item) => item.i in registry)
    .map((item) => ({ ...item, minW: 1, minH: 1 }))

  const handleStop = useCallback(
    (currentLayout: Layout[]) => {
      if (!editable) return
      const positionMap = Object.fromEntries(currentLayout.map((l) => [l.i, l]))
      const merged: LayoutItem[] = layout.map((item) => {
        const pos = positionMap[item.i]
        return pos ? { ...item, x: pos.x, y: pos.y, w: pos.w, h: pos.h } : item
      })
      onLayoutChange(merged)
    },
    [editable, layout, onLayoutChange],
  )

  if (validItems.length === 0) {
    return (
      <p className="text-text-secondary dark:text-text-dark-secondary text-sm text-center py-12">
        {t(emptyKey)}
      </p>
    )
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: validItems, md: validItems, sm: validItems }}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={60}
      margin={[16, 16]}
      isDraggable={editable}
      isResizable={editable}
      compactType={null}
      preventCollision={false}
      allowOverlap={false}
      onDragStop={handleStop}
      onResizeStop={handleStop}
      draggableHandle=".widget-drag-handle"
    >
      {validItems.map((item) => {
        const def = registry[item.i]
        const WidgetComponent = def.component
        return (
          <div key={item.i} className={def.allowOverflow ? 'maya-widget-item--overflow' : undefined}>
            <WidgetFrame
              title={t(def.titleKey)}
              hideTitle={def.hideTitle}
              editable={editable}
              onRemove={() => onRemoveWidget(item.i)}
              removeAriaLabel={removeAriaLabel}
              highlight={def.highlight}
              allowOverflow={def.allowOverflow}
              bleed={def.bleed}
            >
              <WidgetComponent />
            </WidgetFrame>
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}
