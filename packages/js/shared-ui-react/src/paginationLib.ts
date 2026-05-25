/**
 * Helpers de paginación reutilizables. Compartidos por todas las tablas Maya.
 */

export interface PaginationMeta {
  totalItems: number
  totalPages: number
  currentPage: number
  startIndex: number
  endIndex: number
  canGoPrev: boolean
  canGoNext: boolean
}

export interface PaginateResult<T> {
  pageItems: T[]
  meta: PaginationMeta
}

export function paginate<T>(
  items: T[],
  options: { pageSize: number; currentPage: number },
): PaginateResult<T> {
  const { pageSize, currentPage } = options
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = startIndex + pageSize
  return {
    pageItems: items.slice(startIndex, endIndex),
    meta: {
      totalItems,
      totalPages,
      currentPage: safePage,
      startIndex,
      endIndex,
      canGoPrev: safePage > 1,
      canGoNext: safePage < totalPages,
    },
  }
}

export type PageNumber = number | 'ellipsis'

/**
 * Calcula la lista de páginas a mostrar en la UI con elipsis cuando
 * el total es grande. Patrón clásico: 1 … N-2 N-1 N+1 N+2 … total.
 */
export function getPageNumbersToDisplay(currentPage: number, totalPages: number): PageNumber[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const candidates = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage - 2,
    currentPage + 1,
    currentPage + 2,
  ])

  const sorted = [...candidates].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: PageNumber[] = []
  let prev = 0
  for (const p of sorted) {
    if (p > prev + 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}
