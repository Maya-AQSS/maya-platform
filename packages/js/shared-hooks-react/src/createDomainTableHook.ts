import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useServerTable,
  type ServerTableFilters,
  type ServerTableQueryParams,
  type UseServerTableOptions,
  type UseServerTableResult,
} from './useServerTable';

/**
 * createDomainTableHook — builds a domain-specific server-side table hook on
 * top of {@link useServerTable}, removing the cancelable fetch boilerplate that
 * each app reimplemented (maya_audit `useAuditTable`, maya_dms
 * `useServerTemplatesTable`/`useServerDocumentsTable`/... — all ~90% identical:
 * `useEffect` + `cancelled` flag + `rows/meta/loading/error/refetch`).
 *
 * It COMPOSES `useServerTable` (the URL/sort/pagination engine) — it does NOT
 * reimplement it — and adds the query loop. The optional `mapParams` adapts the
 * generic `queryParams` to a backend-specific shape (e.g. renaming a sort
 * column), which is the only piece `useServerTable` does not cover.
 *
 * The returned hook accepts a runtime `{ enabled }` flag so a consumer can gate
 * the fetch on a permission (e.g. dms `useServerProcessesTable` only queries
 * when the user can index): when `enabled` is false no request is made and the
 * rows reset to empty.
 *
 * @example
 *   export const useThemesTable = createDomainTableHook({
 *     defaults: { search: '', status: '' },
 *     sortableColumns: ['name', 'updated_at'],
 *     storageKey: 'maya:dms:themes-table',
 *     fetcher: (params) => fetchThemes(params).then((r) => ({ rows: r.data, meta: r.meta })),
 *   });
 *   const t = useThemesTable({ enabled: canIndex });
 *   // <DataTable rows={t.rows} loading={t.loading} sortBy={t.sortBy} onSortChange={t.onSortChange} ... />
 */

export interface DomainTableConfig<
  F extends ServerTableFilters,
  Row,
  Meta,
  ApiParams = ServerTableQueryParams<F>,
> extends UseServerTableOptions<F> {
  /** Runs the server-side query. Receives the already-mapped params. */
  fetcher: (params: ApiParams) => Promise<{ rows: Row[]; meta: Meta }>;
  /** Adapts useServerTable's queryParams to the backend shape. Default: identity. */
  mapParams?: (params: ServerTableQueryParams<F>) => ApiParams;
}

export interface DomainTableRuntimeOptions {
  /** When false, the fetch is skipped (e.g. permission gate). Default: true. */
  enabled?: boolean;
}

export interface UseDomainTableResult<F extends ServerTableFilters, Row, Meta>
  extends UseServerTableResult<F> {
  rows: Row[];
  meta: Meta | null;
  loading: boolean;
  error: unknown;
  enabled: boolean;
  refetch: () => void;
}

export function createDomainTableHook<
  F extends ServerTableFilters,
  Row,
  Meta,
  ApiParams = ServerTableQueryParams<F>,
>(config: DomainTableConfig<F, Row, Meta, ApiParams>) {
  const { fetcher, mapParams, ...tableOptions } = config;

  return function useDomainTable(
    runtime: DomainTableRuntimeOptions = {},
  ): UseDomainTableResult<F, Row, Meta> {
    const enabled = runtime.enabled ?? true;
    const table = useServerTable<F>(tableOptions);

    const apiParams = useMemo(
      () =>
        mapParams
          ? mapParams(table.queryParams)
          : (table.queryParams as unknown as ApiParams),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [table.queryParams],
    );

    const [rows, setRows] = useState<Row[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null);
    const [refetchToken, setRefetchToken] = useState(0);

    const paramsKey = useMemo(() => JSON.stringify(apiParams), [apiParams]);

    useEffect(() => {
      if (!enabled) {
        setRows([]);
        setMeta(null);
        setLoading(false);
        setError(null);
        return;
      }
      let cancelled = false;
      setLoading(true);
      setError(null);
      fetcher(apiParams)
        .then((res) => {
          if (cancelled) return;
          setRows(res.rows);
          setMeta(res.meta);
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey, enabled, refetchToken]);

    const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

    return { ...table, rows, meta, loading, error, enabled, refetch };
  };
}
