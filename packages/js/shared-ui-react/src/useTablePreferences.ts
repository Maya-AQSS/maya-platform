import { useCallback, useEffect, useState } from 'react'
import type { SortState } from './DataTable'

interface Stored {
  hidden?: string[]
  sort?: SortState | null
  pageSize?: number
}

interface Options {
  /** Clave única bajo `localStorage`. Recomendado: `maya:<app>:<tabla>`. */
  storageKey: string
  /** Ids ocultos por defecto (1ª vez que entra el usuario). */
  defaultHidden?: string[]
  /** Sort por defecto. */
  defaultSort?: SortState | null
  /** Tamaño de página por defecto. Default: 10. */
  defaultPageSize?: number
}

interface Returned {
  hiddenIds: Set<string>
  toggleHidden: (id: string) => void
  setHiddenIds: (ids: Iterable<string>) => void
  sortBy: SortState | null
  setSortBy: (next: SortState | null) => void
  pageSize: number
  setPageSize: (size: number) => void
}

/**
 * Persistencia simple para preferencias de tabla (`hiddenColumnIds`, `sortBy`,
 * `pageSize`) en `localStorage`. Útil para que usuarios no pierdan su
 * configuración entre sesiones.
 *
 *   const { hiddenIds, toggleHidden, sortBy, setSortBy, pageSize, setPageSize } =
 *     useTablePreferences({ storageKey: 'maya:authz:roles-table' })
 */
export function useTablePreferences({
  storageKey,
  defaultHidden = [],
  defaultSort = null,
  defaultPageSize = 10,
}: Options): Returned {
  const [hiddenIds, setHiddenSet] = useState<Set<string>>(() => new Set(defaultHidden))
  const [sortBy, setSortByState] = useState<SortState | null>(defaultSort)
  const [pageSize, setPageSizeState] = useState<number>(defaultPageSize)
  const [hydrated, setHydrated] = useState(false)

  // Cargar prefs persistidas al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed: Stored = JSON.parse(raw)
        if (Array.isArray(parsed.hidden)) {
          setHiddenSet(new Set(parsed.hidden))
        }
        if (parsed.sort && typeof parsed.sort === 'object') {
          setSortByState(parsed.sort)
        }
        if (typeof parsed.pageSize === 'number' && parsed.pageSize > 0) {
          setPageSizeState(parsed.pageSize)
        }
      }
    } catch {
      /* localStorage no disponible o JSON corrupto — usar defaults */
    } finally {
      setHydrated(true)
    }
  }, [storageKey])

  // Persistir cambios (solo después de hidratar para no machacar con defaults)
  useEffect(() => {
    if (!hydrated) return
    try {
      const payload: Stored = { hidden: [...hiddenIds], sort: sortBy, pageSize }
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      /* noop — al menos queda en memoria */
    }
  }, [storageKey, hiddenIds, sortBy, pageSize, hydrated])

  const toggleHidden = useCallback((id: string) => {
    setHiddenSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const setHiddenIds = useCallback((ids: Iterable<string>) => {
    setHiddenSet(new Set(ids))
  }, [])

  const setSortBy = useCallback((next: SortState | null) => {
    setSortByState(next)
  }, [])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
  }, [])

  return {
    hiddenIds,
    toggleHidden,
    setHiddenIds,
    sortBy,
    setSortBy,
    pageSize,
    setPageSize,
  }
}
