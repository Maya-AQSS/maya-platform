import { useCallback, useEffect, useState } from 'react'
import type { LayoutItem } from './types'

interface Options {
  /** Clave única bajo `localStorage` (recomendado: `maya:<app>:dashboard-layout`). */
  storageKey: string
  /** Layout por defecto al primer arranque o tras un reset. */
  defaultLayout: LayoutItem[]
}

/**
 * Persistencia simple del layout del dashboard usando localStorage.
 * Cada app puede usar este hook si no quiere persistir en backend.
 *
 *   const { layout, loading, saveLayout, resetToDefault } = useDashboardLayoutLocal({
 *     storageKey: 'maya:dms:dashboard-layout',
 *     defaultLayout: DEFAULT_LAYOUT,
 *   })
 */
export function useDashboardLayoutLocal({ storageKey, defaultLayout }: Options) {
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setLayout(parsed as LayoutItem[])
        }
      }
    } catch {
      /* localStorage no disponible o JSON corrupto — usar default */
    } finally {
      setLoading(false)
    }
  }, [storageKey])

  const saveLayout = useCallback(
    async (next: LayoutItem[]) => {
      setLayout(next)
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        /* noop — el cambio queda en memoria al menos */
      }
    },
    [storageKey],
  )

  const resetToDefault = useCallback(async () => {
    setLayout(defaultLayout)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* noop */
    }
  }, [storageKey, defaultLayout])

  return { layout, loading, saveLayout, resetToDefault }
}
