import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu'

/**
 * Caché in-memory de `filtersOpen` por storageKey. Sobrevive a remounts
 * intermedios (skeleton de loading, refetch de React Query) sin esperar al
 * primer effect de hidratación desde localStorage.
 */
const filtersOpenMemory = new Map<string, boolean>()

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  columnId: string
  direction: SortDirection
}

/** Definición de una columna del DataTable. */
export interface ColumnDef<T> {
  /** id estable; usado para sort y para la persistencia de visibilidad. */
  id: string
  /** Cabecera (texto o nodo). Para visibilidad usa `visibilityLabel` si no es string. */
  header: ReactNode
  /** Cómo renderizar la celda para cada fila. */
  cell: (row: T) => ReactNode
  /** Hace la columna ordenable (muestra flechas en el header). */
  sortable?: boolean
  /** Esta columna no puede ocultarse desde el menú (típicamente checkbox/acciones). */
  alwaysVisible?: boolean
  /** Etiqueta para el menú de visibilidad. Default: `header` si es string, si no `id`. */
  visibilityLabel?: string
  /** Alineación horizontal. */
  align?: 'left' | 'center' | 'right'
  /** Ancho/min-width opcional ('120px', '20%', etc.). */
  width?: string
  /** Clases extra para `<th>`. */
  thClassName?: string
  /** Clases extra para `<td>`. */
  tdClassName?: string
}

interface Props<T> {
  /** Definición de columnas en orden de aparición. */
  columns: ColumnDef<T>[]
  /** Filas a renderizar. */
  rows: T[]
  /** Función para obtener una key estable por fila. */
  rowKey: (row: T, index: number) => string | number
  /** Ids de columnas a ocultar (si se controla externamente). */
  hiddenColumnIds?: ReadonlySet<string> | string[]
  /** Estado de ordenación actual. */
  sortBy?: SortState | null
  /** Callback al pulsar una cabecera ordenable. */
  onSortChange?: (next: SortState) => void
  /** Mensaje cuando `rows` está vacío. */
  emptyMessage?: ReactNode
  /** Callback al hacer click en una fila (no en cells interactivas). */
  onRowClick?: (row: T) => void
  /** Clase adicional para la fila. Recibe la fila para customizar. */
  rowClassName?: (row: T, index: number) => string
  className?: string
  /** Título mostrado en la cabecera de la tarjeta de la tabla. */
  title?: ReactNode
  /** Subtítulo/descripción opcional debajo del título. */
  description?: ReactNode
  /**
   * Slot a la izquierda del menú de columnas en la barra de la cabecera.
   * Para la mayoría de casos prefiere `filtersPanel` (panel colapsable inline).
   * Este slot es para inserciones puntuales (botón ajustes, etc.).
   */
  filtersSlot?: ReactNode
  /**
   * Inputs/selects de filtros que se renderizan en un panel colapsable inline
   * entre el toolbar y la tabla. El DataTable expone un botón "Filtros" en el
   * toolbar que muestra/oculta el panel — NO se cierra al hacer click fuera,
   * permitiendo al usuario mantener los filtros visibles mientras opera.
   */
  filtersPanel?: ReactNode
  /** Nº de filtros activos (badge). 0 oculta el badge. */
  filtersActiveCount?: number
  /** Callback al pulsar "Limpiar". Si no se pasa, no se renderiza el botón. */
  onClearFilters?: () => void
  /** Estado inicial del panel (default `false`). */
  filtersDefaultOpen?: boolean
  /**
   * Si se pasa, el estado abierto/cerrado del panel de filtros se mantiene
   * en un caché in-memory (Map) que sobrevive a remounts intermedios dentro
   * de la misma sesión de página. Al navegar a otra página y volver, los
   * filtros arrancan cerrados.
   */
  filtersStorageKey?: string
  /** Modo controlado: si se pasan estos dos, el padre maneja el estado. */
  filtersOpen?: boolean
  onFiltersOpenChange?: (open: boolean) => void
  /**
   * Estado de carga. Cuando hay datos, muestra una barra de progreso superior
   * sin desmontar la tabla (preserva el foco de inputs en `filtersPanel`).
   * Cuando NO hay datos, muestra filas skeleton dentro del tbody.
   */
  loading?: boolean
  /** Nº de filas skeleton cuando no hay datos. Default: 5. */
  loadingRows?: number
  /**
   * Si se pasa, habilita un toggle vista tabla/cards en el toolbar.
   * Recibe la fila y devuelve el contenido de la card (sin envoltorio — el
   * contenedor de la card lo aplica el DataTable).
   *
   * Si no se pasa pero `enableCards !== false`, se genera automáticamente
   * un cardRender por defecto que itera las columnas visibles como
   * pares etiqueta/valor.
   */
  cardRender?: (row: T, index: number) => ReactNode
  /** Si false, oculta el toggle tabla/cards (incluso con cardRender). Default true. */
  enableCards?: boolean
  /**
   * Render para vista "flip" — tarjetas con cara frontal (imagen/gradiente + título
   * + acción) y trasera (descripción + datos + acción), con icono de voltear
   * en la esquina superior derecha de ambas caras.
   *
   * Si se pasa, se añade un tercer botón de vista en el toolbar. Es excluyente
   * con `'cards'`: al hacer clic en flip se desactiva la vista cards.
   */
  flipCardRender?: (row: T, index: number) => {
    /** URL string para `<img>` o cualquier ReactNode (svg, icono). Opcional. */
    image?: string | ReactNode
    /**
     * Título de la cara frontal. Si se omite, no se renderiza el bloque de
     * texto inferior; cuando además no hay imagen, el placeholder muestra
     * sólo el gradiente. Si se pasa, sirve también como fallback de imagen.
     */
    title?: ReactNode
    /** Subtítulo o badge bajo el título (también oculto si `title` y `frontAction` están vacíos). */
    frontExtra?: ReactNode
    /** Botón de acción en la cara frontal (típicamente acción primaria). */
    frontAction?: ReactNode
    /** Contenido de la cara trasera: descripción, datos, etc. */
    back: ReactNode
    /** Botón de acción en la cara trasera (típicamente acción secundaria). */
    backAction?: ReactNode
  }
  /** Vista por defecto. Default: `'table'`. */
  defaultView?: 'table' | 'cards' | 'flip'
  /** Tamaño de página actual. Si se pasa con `onPageSizeChange`, se renderiza un select en la cabecera. */
  pageSize?: number
  /** Opciones del select de tamaño. Default `[10, 25, 50, 75, 100]`. */
  pageSizeOptions?: number[]
  /** Callback al cambiar el tamaño de página. */
  onPageSizeChange?: (size: number) => void
  /** Etiqueta del select. Default `'Por página'`. */
  pageSizeLabel?: string
  /**
   * Persiste la vista (table/cards) en localStorage bajo
   * `${viewStorageKey ?? filtersStorageKey}:view`.
   */
  viewStorageKey?: string
  /** Etiqueta del botón "Filtros" (default). */
  filtersLabel?: string
  /** Etiqueta del botón "Limpiar" (default). */
  clearFiltersLabel?: string
  /**
   * Si se pasa, se renderiza un `ColumnVisibilityMenu` integrado en la cabecera.
   * El consumidor sigue manteniendo el estado (típico con `useTablePreferences`).
   */
  onToggleHiddenColumn?: (columnId: string) => void
  /** Etiqueta del botón de columnas (default: "Columnas"). */
  columnsLabel?: string
  /** Oculta el botón de columnas aunque se pase `onToggleHiddenColumn`. */
  hideColumnsMenu?: boolean
}

const SORT_ARROWS: Record<SortDirection | 'none', string> = {
  asc: '↑',
  desc: '↓',
  none: '↕',
}

function alignClass(align?: 'left' | 'center' | 'right') {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

interface FlipCardFace {
  image?: string | ReactNode
  title?: ReactNode
  frontExtra?: ReactNode
  frontAction?: ReactNode
  back: ReactNode
  backAction?: ReactNode
}

function isStringImage(img: FlipCardFace['image']): img is string {
  return typeof img === 'string'
}

/**
 * Tarjeta volteable con dos caras. La cara frontal muestra imagen (o gradiente
 * con título grande si no hay imagen), título y acción primaria. La trasera
 * muestra contenido libre y acción secundaria. El icono de voltear vive en la
 * esquina superior derecha de ambas caras.
 */
function FlipCard({ face }: { face: FlipCardFace }) {
  const [flipped, setFlipped] = useState(false)
  const [imageError, setImageError] = useState(false)
  const handleFlip = (e: ReactMouseEvent) => {
    e.stopPropagation()
    setFlipped((v) => !v)
  }
  const hasImage = face.image != null && !(imageError && isStringImage(face.image))
  const hasFrontText = face.title != null || face.frontExtra != null || face.frontAction != null
  // Si solo hay imagen (sin texto), la card se ajusta al ratio de la imagen
  // (aspect-square por defecto). Si hay texto, altura fija para acomodar imagen
  // + bloque de texto sin que el contenido salte.
  const containerShape = hasFrontText ? 'h-72' : 'aspect-square'

  return (
    <div className={`relative ${containerShape} [perspective:1200px]`}>
      <div
        className={[
          'relative w-full h-full transition-transform duration-500 ease-out',
          'motion-reduce:transition-none',
          '[transform-style:preserve-3d]',
          flipped ? '[transform:rotateY(180deg)]' : '',
        ].join(' ')}
      >
        {/* FRONT */}
        <div
          className={[
            'absolute inset-0 [backface-visibility:hidden]',
            'rounded-2xl overflow-hidden border border-ui-border dark:border-ui-dark-border',
            'bg-ui-card dark:bg-ui-dark-card',
            'shadow-[0_10px_20px_-10px_rgba(15,23,42,0.18),0_2px_4px_-2px_rgba(15,23,42,0.12)] dark:shadow-none',
            'flex flex-col',
          ].join(' ')}
        >
          <div
            className={[
              'relative flex-shrink-0 overflow-hidden',
              hasFrontText ? 'h-40' : 'h-full',
              hasImage ? 'bg-ui-body dark:bg-ui-dark-bg/40' : '',
            ].join(' ')}
          >
            {hasImage && isStringImage(face.image) ? (
              <img
                src={face.image}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : hasImage ? (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-text-inverse">
                {face.image}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center px-4">
                {face.title ? (
                  <span className="text-text-inverse text-2xl font-bold tracking-tight text-center line-clamp-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                    {face.title}
                  </span>
                ) : null}
              </div>
            )}
            <button
              type="button"
              onClick={handleFlip}
              aria-label="Voltear tarjeta"
              title="Voltear"
              className={[
                'absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full',
                'bg-ui-card/85 dark:bg-ui-dark-card/85 backdrop-blur-sm',
                'text-odoo-purple dark:text-odoo-dark-purple',
                'border border-ui-border-l dark:border-ui-dark-border-l',
                'shadow-sm hover:bg-ui-card dark:hover:bg-ui-dark-card transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
              </svg>
            </button>
          </div>
          {hasFrontText ? (
            <div className="flex flex-col gap-2 p-4 flex-1 min-h-0">
              {face.title ? (
                <div className="text-base font-semibold text-text-primary dark:text-text-dark-primary leading-tight break-words line-clamp-2">
                  {face.title}
                </div>
              ) : null}
              {face.frontExtra ? (
                <div className="text-sm text-text-secondary dark:text-text-dark-secondary leading-snug break-words">
                  {face.frontExtra}
                </div>
              ) : null}
              {face.frontAction ? (
                <div
                  className="mt-auto pt-2 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {face.frontAction}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* BACK */}
        <div
          className={[
            'absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]',
            'rounded-2xl overflow-hidden border border-ui-border dark:border-ui-dark-border',
            'bg-ui-card dark:bg-ui-dark-card',
            'shadow-[0_10px_20px_-10px_rgba(15,23,42,0.18),0_2px_4px_-2px_rgba(15,23,42,0.12)] dark:shadow-none',
            'flex flex-col',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={handleFlip}
            aria-label="Voltear tarjeta"
            title="Voltear"
            className={[
              'absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full',
              'bg-ui-card/85 dark:bg-ui-dark-card/85 backdrop-blur-sm',
              'text-odoo-purple dark:text-odoo-dark-purple',
              'border border-ui-border-l dark:border-ui-dark-border-l',
              'shadow-sm hover:bg-ui-card dark:hover:bg-ui-dark-card transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
            ].join(' ')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
          </button>
          <div className="flex flex-col gap-2 p-4 pt-12 flex-1 min-h-0 overflow-y-auto text-sm text-text-secondary dark:text-text-dark-secondary">
            {face.back}
          </div>
          {face.backAction ? (
            <div
              className="px-4 pb-4 pt-2 flex items-center gap-2 border-t border-ui-border-l/60 dark:border-ui-dark-border-l/60"
              onClick={(e) => e.stopPropagation()}
            >
              {face.backAction}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Tabla genérica con columnas declarativas, sort opcional, oculto/visible
 * por columna, y onRowClick.
 *
 *   <DataTable
 *     columns={[
 *       { id: 'name', header: 'Nombre', cell: (r) =&gt; r.name, sortable: true },
 *       { id: 'email', header: 'Email', cell: (r) =&gt; r.email },
 *       { id: 'actions', header: '', cell: (r) =&gt; &lt;...&gt;, alwaysVisible: true },
 *     ]}
 *     rows={users}
 *     rowKey={(u) =&gt; u.id}
 *     sortBy={sort}
 *     onSortChange={setSort}
 *   /&gt;
 */
export function DataTable<T>({
  columns,
  rows: rawRows,
  rowKey,
  hiddenColumnIds,
  sortBy = null,
  onSortChange,
  emptyMessage = 'Sin datos',
  onRowClick,
  rowClassName,
  className = '',
  title,
  description,
  filtersSlot,
  filtersPanel,
  filtersActiveCount = 0,
  onClearFilters,
  filtersDefaultOpen = false,
  filtersStorageKey,
  filtersOpen: filtersOpenControlled,
  onFiltersOpenChange,
  filtersLabel = 'Filtros',
  clearFiltersLabel = 'Limpiar',
  onToggleHiddenColumn,
  columnsLabel,
  hideColumnsMenu = false,
  loading = false,
  loadingRows = 5,
  cardRender: cardRenderProp,
  enableCards = true,
  flipCardRender,
  defaultView = 'table',
  viewStorageKey,
  pageSize,
  pageSizeOptions = [10, 25, 50, 75, 100],
  onPageSizeChange,
  pageSizeLabel = 'Por página',
}: Props<T>) {
  // Auto-genera un cardRender por defecto a partir de las columnas visibles.
  // Sin etiquetas: la primera columna actúa como título destacado, la segunda
  // como subtítulo, el resto como detalles atenuados. Las columnas marcadas
  // `alwaysVisible` (típicamente acciones) se separan al pie de la card.
  const visibleColumnsForCards = columns.filter(
    (c) => !(hiddenColumnIds instanceof Set ? hiddenColumnIds : new Set(hiddenColumnIds ?? [])).has(c.id),
  )
  const cardActionCols = visibleColumnsForCards.filter((c) => c.alwaysVisible)
  const cardDataCols = visibleColumnsForCards.filter((c) => !c.alwaysVisible)
  const [titleCol, subtitleCol, ...detailCols] = cardDataCols

  const autoCardRender = (row: T): ReactNode => (
    <div className="flex flex-col gap-3 h-full">
      {titleCol ? (
        <div className="text-base font-semibold text-odoo-purple-d dark:text-text-dark-primary leading-tight break-words">
          {titleCol.cell(row)}
        </div>
      ) : null}
      {subtitleCol ? (
        <div className="text-sm text-text-secondary dark:text-text-dark-secondary leading-snug break-words -mt-2">
          {subtitleCol.cell(row)}
        </div>
      ) : null}
      {detailCols.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary dark:text-text-dark-secondary">
          {detailCols.map((col) => (
            <span key={col.id} className="inline-flex items-center min-w-0 break-words">
              {col.cell(row)}
            </span>
          ))}
        </div>
      ) : null}
      {cardActionCols.length > 0 ? (
        <div
          className="mt-auto truncate pt-2 flex items-center justify gap-1.5 border-t border-ui-border-l/60 dark:border-ui-dark-border-l/60"
          onClick={(e) => e.stopPropagation()}
        >
          {cardActionCols.map((col) => (
            <span key={col.id}>{col.cell(row)}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
  const cardRender =
    cardRenderProp ?? (enableCards ? autoCardRender : undefined)

  // Vista (table/cards/flip) — solo si se pasa cardRender o flipCardRender.
  // Persistida si hay key.
  const viewKey = viewStorageKey ?? filtersStorageKey
  const hasFlip = typeof flipCardRender === 'function'
  const [view, setView] = useState<'table' | 'cards' | 'flip'>(() => {
    if (!cardRender && !hasFlip) return 'table'
    if (viewKey) {
      try {
        const raw = localStorage.getItem(`${viewKey}:view`)
        if (raw === 'cards' && cardRender) return raw
        if (raw === 'flip' && hasFlip) return raw
        if (raw === 'table') return raw
      } catch { /* noop */ }
    }
    if (defaultView === 'flip' && !hasFlip) return 'table'
    if (defaultView === 'cards' && !cardRender) return 'table'
    return defaultView
  })
  useEffect(() => {
    if (!viewKey || (!cardRender && !hasFlip)) return
    try { localStorage.setItem(`${viewKey}:view`, view) } catch { /* noop */ }
  }, [view, viewKey, cardRender, hasFlip])
  // Defensive: ensure rows is never undefined (prevents crash if caller passes undefined).
  const rows = rawRows ?? ([] as T[])

  const isControlled = typeof filtersOpenControlled === 'boolean'
  // Estado uncontrolled: hidrata desde memory cache (remount-safe dentro de la
  // misma sesión de página) pero NO desde localStorage — los filtros deben
  // arrancar cerrados al navegar a la página.
  const [filtersOpenState, setFiltersOpenState] = useState<boolean>(() => {
    if (filtersStorageKey != null) {
      const cached = filtersOpenMemory.get(filtersStorageKey)
      if (typeof cached === 'boolean') return cached
    }
    return filtersDefaultOpen
  })
  const filtersOpen = isControlled ? filtersOpenControlled : filtersOpenState

  // Sync in-memory cache (remount-safe) — no localStorage para filtersOpen,
  // así al navegar a la página siempre arrancan cerrados.
  useEffect(() => {
    if (isControlled || !filtersStorageKey) return
    filtersOpenMemory.set(filtersStorageKey, filtersOpenState)
  }, [isControlled, filtersStorageKey, filtersOpenState])

  function setFiltersOpen(next: boolean | ((prev: boolean) => boolean)) {
    const value = typeof next === 'function' ? (next as (p: boolean) => boolean)(filtersOpen) : next
    if (isControlled) {
      onFiltersOpenChange?.(value)
    } else {
      setFiltersOpenState(value)
    }
  }
  const hidden = hiddenColumnIds instanceof Set
    ? hiddenColumnIds
    : new Set(hiddenColumnIds ?? [])

  const visibleColumns = columns.filter((c) => !hidden.has(c.id))

  function handleHeaderClick(col: ColumnDef<T>) {
    if (!col.sortable || !onSortChange) return
    const isSame = sortBy?.columnId === col.id
    const nextDir: SortDirection = isSame && sortBy?.direction === 'asc' ? 'desc' : 'asc'
    onSortChange({ columnId: col.id, direction: nextDir })
  }

  const hasFiltersPanel = filtersPanel != null
  const showPageSizeSelector =
    typeof pageSize === 'number' && typeof onPageSizeChange === 'function'
  const hasToolbar =
    title != null ||
    description != null ||
    filtersSlot != null ||
    hasFiltersPanel ||
    showPageSizeSelector ||
    (!hideColumnsMenu && typeof onToggleHiddenColumn === 'function')

  return (
    <div
      className={[
        'rounded-2xl border border-ui-border-l dark:border-ui-dark-border',
        'bg-ui-card dark:bg-ui-dark-card shadow-sm',
        className,
      ].join(' ').trim()}
    >
      {hasToolbar ? (
        <div className="flex flex-col gap-3 px-4 py-3 border-b border-ui-border-l dark:border-ui-dark-border-l sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title != null ? (
              <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary truncate">
                {title}
              </h3>
            ) : null}
            {description != null ? (
              <p className="mt-0.5 text-xs text-text-secondary dark:text-text-dark-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:justify-end">
            {/* Limpiar inline al lado de Filtros (solo si panel abierto + activos). */}
            {hasFiltersPanel && filtersOpen && onClearFilters && filtersActiveCount > 0 ? (
              <button
                type="button"
                onClick={onClearFilters}
                className={[
                  'inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors',
                  'bg-ui-card dark:bg-ui-dark-card text-danger',
                  'border-danger/40 hover:bg-danger/8 hover:border-danger/60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/35',
                ].join(' ')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>{clearFiltersLabel}</span>
              </button>
            ) : null}
            {hasFiltersPanel ? (
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-controls="datatable-filters-panel"
                className={[
                  'inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors',
                  'bg-ui-card dark:bg-ui-dark-card text-text-primary dark:text-text-dark-primary',
                  filtersOpen
                    ? 'border-odoo-purple/60 dark:border-odoo-dark-purple/60 bg-odoo-purple/8 dark:bg-odoo-dark-purple/15'
                    : 'border-odoo-purple/30 dark:border-odoo-dark-purple/40 hover:bg-odoo-purple/8 dark:hover:bg-odoo-dark-purple/15 hover:border-odoo-purple/55 dark:hover:border-odoo-dark-purple/60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
                ].join(' ')}
              >
                <span className="text-odoo-purple dark:text-odoo-dark-purple">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </span>
                <span>{filtersLabel}</span>
                {filtersActiveCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-xs font-bold rounded-full bg-gradient-primary text-text-inverse">
                    {filtersActiveCount}
                  </span>
                ) : null}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-150 ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            ) : null}
            {filtersSlot}
            {!hideColumnsMenu && typeof onToggleHiddenColumn === 'function' ? (
              <ColumnVisibilityMenu
                columns={columns}
                hiddenColumnIds={hidden}
                onToggle={onToggleHiddenColumn}
                label={columnsLabel}
              />
            ) : null}
            {showPageSizeSelector ? (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange!(Number(e.target.value))}
                aria-label={pageSizeLabel}
                title={pageSizeLabel}
                className={[
                  'h-9 px-3 pr-7 rounded-md border text-sm font-medium cursor-pointer',
                  'bg-ui-card dark:bg-ui-dark-card text-text-primary dark:text-text-dark-primary',
                  'border-ui-border dark:border-ui-dark-border',
                  'hover:border-odoo-purple/40 dark:hover:border-odoo-dark-purple/40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
                ].join(' ')}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-ui-card dark:bg-ui-dark-card">
                    {opt}
                  </option>
                ))}
              </select>
            ) : null}
            {cardRender || hasFlip ? (
              <div role="group" aria-label="Vista" className="inline-flex h-9 rounded-md border border-ui-border dark:border-ui-dark-border bg-ui-card dark:bg-ui-dark-card overflow-hidden">
                <button
                  type="button"
                  aria-pressed={view === 'table'}
                  onClick={() => setView('table')}
                  title="Vista tabla"
                  className={[
                    'inline-flex items-center justify-center w-9 transition-colors',
                    view === 'table'
                      ? 'bg-odoo-purple/10 dark:bg-odoo-dark-purple/20 text-odoo-purple dark:text-odoo-dark-purple'
                      : 'text-text-secondary dark:text-text-dark-secondary hover:bg-ui-body dark:hover:bg-ui-dark-bg',
                  ].join(' ')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                {cardRender ? (
                  <button
                    type="button"
                    aria-pressed={view === 'cards'}
                    onClick={() => setView('cards')}
                    title="Vista tarjetas"
                    className={[
                      'inline-flex items-center justify-center w-9 transition-colors border-l border-ui-border dark:border-ui-dark-border',
                      view === 'cards'
                        ? 'bg-odoo-purple/10 dark:bg-odoo-dark-purple/20 text-odoo-purple dark:text-odoo-dark-purple'
                        : 'text-text-secondary dark:text-text-dark-secondary hover:bg-ui-body dark:hover:bg-ui-dark-bg',
                    ].join(' ')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                ) : null}
                {hasFlip ? (
                  <button
                    type="button"
                    aria-pressed={view === 'flip'}
                    onClick={() => setView('flip')}
                    title="Vista tarjetas con dorso"
                    className={[
                      'inline-flex items-center justify-center w-9 transition-colors border-l border-ui-border dark:border-ui-dark-border',
                      view === 'flip'
                        ? 'bg-odoo-purple/10 dark:bg-odoo-dark-purple/20 text-odoo-purple dark:text-odoo-dark-purple'
                        : 'text-text-secondary dark:text-text-dark-secondary hover:bg-ui-body dark:hover:bg-ui-dark-bg',
                    ].join(' ')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="14" height="16" rx="2" />
                      <path d="M7 4v16" />
                      <path d="M14 8l3 -2 3 2" />
                      <path d="M20 6v10l-3 2 -3 -2" />
                    </svg>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {hasFiltersPanel && filtersOpen ? (
        <div
          id="datatable-filters-panel"
          className="px-4 py-3 border-b border-ui-border-l dark:border-ui-dark-border-l bg-ui-body/40 dark:bg-ui-dark-bg/30"
        >
          {/* Subblock card que envuelve los filtros — estilo visual DMS. */}
          <div className="rounded-lg border border-ui-border dark:border-ui-dark-border bg-ui-card dark:bg-ui-dark-card px-4 py-3 shadow-sm">
            <div
              className="grid gap-3 items-end"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
            >
              {filtersPanel}
            </div>
          </div>
        </div>
      ) : null}
      {loading && rows.length > 0 ? (
        <div className="h-0.5 w-full overflow-hidden bg-ui-border-l/40 dark:bg-ui-dark-border-l/40">
          <div className="h-full w-1/3 bg-gradient-primary animate-[loading-bar_1.2s_ease-in-out_infinite]" />
        </div>
      ) : null}
      <style>{`@keyframes loading-bar{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
      {hasFlip && view === 'flip' ? (
        <div className={['p-3', loading && rows.length > 0 ? 'opacity-90' : ''].join(' ').trim()}>
          {loading && rows.length === 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: loadingRows }).map((_, i) => (
                <div key={`sk-flip-${i}`} className="rounded-2xl border border-ui-border-l dark:border-ui-dark-border-l bg-ui-body/40 dark:bg-ui-dark-bg/30 h-72 animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-text-secondary dark:text-text-dark-secondary text-sm">
              {emptyMessage}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {rows.map((row, i) => {
                const face = flipCardRender!(row, i)
                const clickable = typeof onRowClick === 'function'
                return (
                  <div
                    key={rowKey(row, i)}
                    onClick={clickable ? () => onRowClick!(row) : undefined}
                    className={clickable ? 'cursor-pointer' : undefined}
                  >
                    <FlipCard face={face} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : cardRender && view === 'cards' ? (
        <div className={['p-3', loading && rows.length > 0 ? 'opacity-90' : ''].join(' ').trim()}>
          {loading && rows.length === 0 ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: loadingRows }).map((_, i) => (
                <div key={`sk-card-${i}`} className="rounded-xl border border-ui-border-l dark:border-ui-dark-border-l bg-ui-body/40 dark:bg-ui-dark-bg/30 p-4 h-32 animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-text-secondary dark:text-text-dark-secondary text-sm">
              {emptyMessage}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {rows.map((row, i) => {
                const clickable = typeof onRowClick === 'function'
                return (
                  <div
                    key={rowKey(row, i)}
                    onClick={clickable ? () => onRowClick!(row) : undefined}
                    className={[
                      'rounded-2xl border border-ui-border dark:border-ui-dark-border',
                      'bg-ui-card dark:bg-ui-dark-card p-4 h-full flex flex-col gap-2',
                      'shadow-[0_10px_20px_-10px_rgba(15,23,42,0.18),0_2px_4px_-2px_rgba(15,23,42,0.12)] dark:shadow-none',
                      'transition',
                      clickable
                        ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_24px_-12px_rgba(15,23,42,0.25),0_4px_8px_-4px_rgba(15,23,42,0.14)] dark:hover:shadow-none hover:border-odoo-purple/40 dark:hover:border-odoo-dark-purple/50'
                        : '',
                      rowClassName?.(row, i) ?? '',
                    ].join(' ').trim()}
                  >
                    {cardRender(row, i)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
      <div className={['overflow-x-auto', loading && rows.length > 0 ? 'opacity-90' : ''].join(' ').trim()}>
      <table className="min-w-full text-sm">
        <thead className="bg-ui-body/60 dark:bg-ui-dark-bg/40">
          <tr>
            {visibleColumns.map((col) => {
              const sortIcon = col.sortable
                ? sortBy?.columnId === col.id
                  ? SORT_ARROWS[sortBy.direction]
                  : SORT_ARROWS.none
                : null
              return (
                <th
                  key={col.id}
                  scope="col"
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  className={[
                    'px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold',
                    'text-text-secondary dark:text-text-dark-secondary',
                    'border-b border-ui-border-l dark:border-ui-dark-border-l',
                    alignClass(col.align),
                    col.sortable
                      ? 'cursor-pointer select-none hover:text-text-primary dark:hover:text-text-dark-primary'
                      : '',
                    col.thClassName ?? '',
                  ].join(' ').trim()}
                  onClick={col.sortable ? () => handleHeaderClick(col) : undefined}
                  aria-sort={
                    col.sortable
                      ? sortBy?.columnId === col.id
                        ? sortBy.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {sortIcon ? (
                      <span aria-hidden className="text-xs opacity-60">
                        {sortIcon}
                      </span>
                    ) : null}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={`sk-${i}`} style={{ height: 52 }} className="border-b last:border-0 border-ui-border-l dark:border-ui-dark-border-l">
                {visibleColumns.map((col) => (
                  <td key={col.id} className="px-4 py-2 align-middle">
                    <div className="h-3 w-3/4 rounded bg-ui-border-l/60 dark:bg-ui-dark-border-l/40 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length}
                className="px-4 py-10 text-center text-text-secondary dark:text-text-dark-secondary text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const extraCls = rowClassName?.(row, i) ?? ''
              const clickable = typeof onRowClick === 'function'
              return (
                <tr
                  key={rowKey(row, i)}
                  style={{ height: 52 }}
                  className={[
                    'border-b last:border-0 border-ui-border-l dark:border-ui-dark-border-l',
                    'transition-colors',
                    clickable
                      ? 'cursor-pointer hover:bg-odoo-purple/4 dark:hover:bg-odoo-dark-purple/10'
                      : 'hover:bg-ui-body/60 dark:hover:bg-ui-dark-bg/30',
                    extraCls,
                  ].join(' ').trim()}
                  onClick={clickable ? () => onRowClick!(row) : undefined}
                >
                  {visibleColumns.map((col) => (
                    <td
                      key={col.id}
                      className={[
                        'px-4 py-2 align-middle text-text-primary dark:text-text-dark-primary',
                        alignClass(col.align),
                        col.tdClassName ?? '',
                      ].join(' ').trim()}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      </div>
      )}
    </div>
  )
}
