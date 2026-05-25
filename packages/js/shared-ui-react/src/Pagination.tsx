import { getPageNumbersToDisplay } from './paginationLib'

interface Props {
  /** Página actual (1-based). */
  currentPage: number
  /** Total de páginas. */
  totalPages: number
  /** Callback al cambiar de página. */
  onChange: (page: number) => void
  /** Etiqueta accesible del nav. */
  ariaLabel?: string
  /** Etiqueta del botón "Anterior". */
  prevLabel?: string
  /** Etiqueta del botón "Siguiente". */
  nextLabel?: string
  /** Función para construir aria-label de cada número (`{page}` se reemplaza). */
  pageAriaLabel?: (page: number) => string
  /** Texto opcional informativo (`Mostrando 1-10 de 42`). */
  info?: string
  /** Oculta el componente cuando solo hay 1 página. Default true. */
  hideWhenSingle?: boolean
  className?: string
  /** Si se pasa junto con `onPageSizeChange`, muestra un selector de tamaño. */
  pageSize?: number
  /** Opciones del selector de tamaño. Default `[10, 25, 50, 75, 100]`. */
  pageSizeOptions?: number[]
  /** Callback al cambiar el tamaño de página. */
  onPageSizeChange?: (size: number) => void
  /** Etiqueta del selector. Default `'Elementos por página'`. */
  pageSizeLabel?: string
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100]

/**
 * Paginación numérica reutilizable: prev / 1 … 4 5 [6] 7 8 … N / next.
 * Opcionalmente muestra un selector de tamaño de página a la izquierda.
 *
 *   <Pagination
 *     currentPage={page}
 *     totalPages={Math.ceil(total / pageSize)}
 *     onChange={setPage}
 *     pageSize={pageSize}
 *     onPageSizeChange={setPageSize}
 *     info={`Mostrando ${start}-${end} de ${total}`}
 *   />
 */
export function Pagination({
  currentPage,
  totalPages,
  onChange,
  ariaLabel = 'Paginación',
  prevLabel = 'Anterior',
  nextLabel = 'Siguiente',
  pageAriaLabel = (p) => `Página ${p}`,
  info,
  hideWhenSingle = true,
  className = '',
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  pageSizeLabel = 'Elementos por página',
}: Props) {
  const showSizeSelector =
    typeof pageSize === 'number' && typeof onPageSizeChange === 'function'

  if (hideWhenSingle && totalPages <= 1 && !info && !showSizeSelector) return null

  const pages = getPageNumbersToDisplay(currentPage, totalPages)
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  const baseBtn =
    'h-8 min-w-[2rem] px-2 inline-flex items-center justify-center rounded-md text-sm font-medium ' +
    'border transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'

  const inactiveBtn =
    baseBtn +
    ' bg-ui-card dark:bg-ui-dark-card text-text-primary dark:text-text-dark-primary ' +
    'border-ui-border dark:border-ui-dark-border ' +
    'hover:bg-odoo-purple/8 dark:hover:bg-odoo-dark-purple/15 hover:border-odoo-purple/40 dark:hover:border-odoo-dark-purple/40'

  const activeBtn =
    baseBtn +
    ' bg-gradient-primary text-text-inverse border-transparent shadow-[0_3px_10px_-3px_rgba(113,75,103,0.55)]'

  return (
    <div
      className={[
        'flex flex-col gap-2',
        showSizeSelector ? 'sm:flex-row sm:items-center sm:justify-between' : 'items-center',
        className,
      ]
        .join(' ')
        .trim()}
    >
      {showSizeSelector ? (
        <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-text-secondary dark:text-text-dark-secondary">
          <span>{pageSizeLabel}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange!(Number(e.target.value))}
            className={[
              'h-8 px-2 pr-7 rounded-md text-sm font-medium',
              'bg-ui-card dark:bg-ui-dark-card text-text-primary dark:text-text-dark-primary',
              'border border-ui-border dark:border-ui-dark-border',
              'hover:border-odoo-purple/40 dark:hover:border-odoo-dark-purple/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
              'cursor-pointer',
            ].join(' ')}
            aria-label={pageSizeLabel}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div
        className={[
          'flex flex-col items-center gap-2',
          showSizeSelector ? 'sm:items-end' : '',
        ]
          .join(' ')
          .trim()}
      >
        {totalPages > 1 || !hideWhenSingle ? (
          <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label={ariaLabel}>
            <button
              type="button"
              onClick={() => onChange(currentPage - 1)}
              disabled={!canPrev}
              className={inactiveBtn}
            >
              {prevLabel}
            </button>

            {pages.map((p, i) =>
              p === 'ellipsis' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1.5 text-text-secondary dark:text-text-dark-secondary text-sm"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                  aria-label={pageAriaLabel(p)}
                  className={p === currentPage ? activeBtn : inactiveBtn}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => onChange(currentPage + 1)}
              disabled={!canNext}
              className={inactiveBtn}
            >
              {nextLabel}
            </button>
          </nav>
        ) : null}

        {info ? (
          <span className="text-xs sm:text-sm text-text-secondary dark:text-text-dark-secondary">
            {info}
          </span>
        ) : null}
      </div>
    </div>
  )
}
