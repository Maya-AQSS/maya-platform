import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useServerTable — estado unificado de listados server-side para el ecosistema Maya.
 *
 * Centraliza el patrón que hoy se duplica en cada app (ver maya_logs/LogsPage):
 *   - filtros de dominio sincronizados a la URL (compartibles, back/forward),
 *   - paginación clásica server-side (`page` en URL + `per_page` en localStorage),
 *   - ordenación server-side con whitelist (`sort_by`/`sort_dir` en URL),
 *   - reset automático a página 1 al cambiar cualquier filtro o el orden.
 *
 * Es **state-only**: NO ejecuta la query. Expone `queryParams` (el objeto a enviar
 * al backend) y los bindings para `DataTable`/`Pagination`. El consumidor mantiene
 * su propio `useQuery`/`createDataHook`, de modo que el paquete no se acopla a una
 * versión concreta de react-query.
 *
 * Uso típico:
 *
 *     const table = useServerTable({
 *       defaults: { search: '', status: '' },
 *       sortableColumns: ['created_at', 'name'],
 *       storageKey: 'maya:dms:templates-table',
 *       defaultSort: { columnId: 'updated_at', direction: 'desc' },
 *     });
 *     const q = useTemplatesQuery(table.queryParams);
 *     // <DataTable sortBy={table.sortBy} onSortChange={table.onSortChange} rows={q.data?.data ?? []} ... />
 *     // <Pagination currentPage={table.page} totalPages={q.data?.last_page ?? 1} onChange={table.onPageChange}
 *     //   pageSize={table.pageSize} onPageSizeChange={table.onPageSizeChange} />
 */

export type SortDirection = 'asc' | 'desc';

/** Espejo estructural de `SortState` de shared-ui-react (typing estructural, sin acoplar paquetes). */
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

/** Claves reservadas en la URL — nunca se tratan como filtros de dominio. */
export const RESERVED_TABLE_PARAMS = ['page', 'sort_by', 'sort_dir'] as const;

/** Mapa de filtros de dominio: clave = nombre del query param, valor = string. */
export type ServerTableFilters = Record<string, string>;

/** Params finales que el consumidor envía al backend. */
export type ServerTableQueryParams<F extends ServerTableFilters> = F & {
  page: number;
  per_page: number;
  sort_by?: string;
  sort_dir?: SortDirection;
};

export interface UseServerTableOptions<F extends ServerTableFilters> {
  /** Valores de filtro por defecto. Las claves definen qué params de URL son filtros de dominio. */
  defaults: F;
  /** Whitelist de columnas ordenables (espejo de la del backend). Sort fuera de aquí se ignora. */
  sortableColumns: readonly string[];
  /** Clave de localStorage para persistir `per_page`. P. ej. `maya:dms:templates-table`. */
  storageKey: string;
  /** Orden inicial cuando la URL no trae `sort_by`/`sort_dir`. */
  defaultSort?: SortState | null;
  /** Tamaño de página por defecto. Default: 15. */
  defaultPageSize?: number;
}

export interface UseServerTableResult<F extends ServerTableFilters> {
  /** Filtros de dominio actuales (derivados de la URL). */
  filters: F;
  /** Actualiza un filtro y resetea a página 1. `undefined`/'' lo elimina de la URL. */
  setFilter: (key: keyof F, value: string | undefined) => void;
  /** Actualiza varios filtros a la vez y resetea a página 1. */
  setFilters: (patch: Partial<F>) => void;
  /** Limpia todos los filtros de dominio (mantiene orden). Resetea a página 1. */
  resetFilters: () => void;
  /** Nº de filtros activos (distintos de su valor por defecto). Para el badge de `DataTable`. */
  filtersActiveCount: number;

  /** Página actual (1-based). */
  page: number;
  /** Navega de página (no resetea filtros ni orden). */
  onPageChange: (page: number) => void;
  /** Tamaño de página actual (persistido en localStorage). */
  pageSize: number;
  /** Cambia el tamaño de página y resetea a página 1. */
  onPageSizeChange: (size: number) => void;

  /** Estado de orden actual o `null`. Para `DataTable.sortBy`. */
  sortBy: SortState | null;
  /** Cambia el orden (valida contra whitelist) y resetea a página 1. Para `DataTable.onSortChange`. */
  onSortChange: (next: SortState) => void;

  /** Objeto listo para enviar al backend / usar como queryKey. */
  queryParams: ServerTableQueryParams<F>;
}

// ---------------------------------------------------------------------------
// Helpers puros (exportados para test unitario sin renderizar React).
// ---------------------------------------------------------------------------

/**
 * Lee filtros de dominio + page + sort desde los query params de la URL.
 * Los valores ausentes caen a `defaults`. El sort se valida contra la whitelist.
 */
export function readTableState<F extends ServerTableFilters>(
  params: URLSearchParams,
  defaults: F,
  sortableColumns: readonly string[],
  defaultSort: SortState | null = null,
): { filters: F; page: number; sort: SortState | null } {
  const filters = { ...defaults } as F;
  for (const key of Object.keys(defaults) as Array<keyof F & string>) {
    const value = params.get(key);
    if (value !== null) {
      (filters as ServerTableFilters)[key] = value;
    }
  }

  const pageRaw = params.get('page');
  const pageNum = pageRaw ? Number(pageRaw) : 1;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;

  const sortByRaw = params.get('sort_by');
  const sortDirRaw = params.get('sort_dir');
  const validColumn = sortByRaw != null && sortableColumns.includes(sortByRaw);
  const validDir = sortDirRaw === 'asc' || sortDirRaw === 'desc';
  const sort: SortState | null = validColumn
    ? { columnId: sortByRaw, direction: validDir ? (sortDirRaw as SortDirection) : 'asc' }
    : defaultSort;

  return { filters, page, sort };
}

/**
 * Serializa filtros + sort + page a `URLSearchParams`, omitiendo valores por
 * defecto/vacíos y `page` cuando es 1, para mantener URLs limpias.
 */
export function writeTableState<F extends ServerTableFilters>(
  filters: F,
  defaults: F,
  sort: SortState | null,
  page: number,
): URLSearchParams {
  const qs = new URLSearchParams();
  for (const key of Object.keys(filters) as Array<keyof F & string>) {
    const value = filters[key];
    const isDefault = value === undefined || value === '' || value === defaults[key];
    if (!isDefault) qs.set(key, String(value));
  }
  if (sort) {
    qs.set('sort_by', sort.columnId);
    qs.set('sort_dir', sort.direction);
  }
  if (page > 1) qs.set('page', String(page));
  return qs;
}

/** Construye el objeto de params para el backend. Omite sort cuando no hay. */
export function buildQueryParams<F extends ServerTableFilters>(
  filters: F,
  page: number,
  perPage: number,
  sort: SortState | null,
): ServerTableQueryParams<F> {
  return {
    ...filters,
    page,
    per_page: perPage,
    ...(sort ? { sort_by: sort.columnId, sort_dir: sort.direction } : {}),
  };
}

/** Cuenta filtros activos (distintos de su valor por defecto). */
export function countActiveFilters<F extends ServerTableFilters>(filters: F, defaults: F): number {
  let n = 0;
  for (const key of Object.keys(filters) as Array<keyof F & string>) {
    const value = filters[key];
    if (value !== undefined && value !== '' && value !== defaults[key]) n += 1;
  }
  return n;
}

/** Lee `per_page` persistido en localStorage; cae a `fallback` si no hay/corrupto. */
export function readStoredPageSize(storageKey: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(`${storageKey}:per_page`);
    if (raw !== null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return Math.floor(n);
    }
  } catch {
    /* localStorage no disponible — usar fallback */
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useServerTable<F extends ServerTableFilters>({
  defaults,
  sortableColumns,
  storageKey,
  defaultSort = null,
  defaultPageSize = 10,
}: UseServerTableOptions<F>): UseServerTableResult<F> {
  const [searchParams, setSearchParams] = useSearchParams();

  // `per_page` vive en localStorage (preferencia de presentación, no estado consultable).
  const [pageSize, setPageSizeState] = useState<number>(() =>
    readStoredPageSize(storageKey, defaultPageSize),
  );
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}:per_page`, String(pageSize));
    } catch {
      /* noop — al menos queda en memoria */
    }
  }, [storageKey, pageSize]);

  const { filters, page, sort } = useMemo(
    () => readTableState(searchParams, defaults, sortableColumns, defaultSort),
    // `defaults`/`sortableColumns`/`defaultSort` se asumen estables por render del consumidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );

  const commit = useCallback(
    (nextFilters: F, nextSort: SortState | null, nextPage: number) => {
      const tableQs = writeTableState(nextFilters, defaults, nextSort, nextPage);
      // Mergear sobre los params actuales en vez de reemplazarlos: el hook solo
      // "posee" sus filtros + sort_by/sort_dir/page. Reemplazar toda la query
      // borraría params ajenos que el consumidor guarde en la URL (p.ej. `tab` en
      // una página con pestañas), tirándolo a la vista por defecto al filtrar.
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of Object.keys(defaults)) next.delete(key); // limpia filtros obsoletos
          next.delete('sort_by');
          next.delete('sort_dir');
          next.delete('page');
          for (const [k, v] of tableQs) next.set(k, v);
          return next;
        },
        { replace: true },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<F>) => {
      commit({ ...filters, ...patch }, sort, 1);
    },
    [commit, filters, sort],
  );

  const setFilter = useCallback(
    (key: keyof F, value: string | undefined) => {
      const next = { ...filters } as F;
      (next as ServerTableFilters)[key as string] = value ?? '';
      commit(next, sort, 1);
    },
    [commit, filters, sort],
  );

  const resetFilters = useCallback(() => {
    commit({ ...defaults }, sort, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, sort]);

  const onPageChange = useCallback(
    (nextPage: number) => {
      commit(filters, sort, nextPage);
    },
    [commit, filters, sort],
  );

  const onPageSizeChange = useCallback(
    (size: number) => {
      setPageSizeState(size > 0 ? Math.floor(size) : defaultPageSize);
      commit(filters, sort, 1);
    },
    [commit, filters, sort, defaultPageSize],
  );

  const onSortChange = useCallback(
    (next: SortState) => {
      if (!sortableColumns.includes(next.columnId)) return;
      commit(filters, next, 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, filters],
  );

  const filtersActiveCount = useMemo(
    () => countActiveFilters(filters, defaults),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters],
  );

  const queryParams = useMemo(
    () => buildQueryParams(filters, page, pageSize, sort),
    [filters, page, pageSize, sort],
  );

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    filtersActiveCount,
    page,
    onPageChange,
    pageSize,
    onPageSizeChange,
    sortBy: sort,
    onSortChange,
    queryParams,
  };
}
